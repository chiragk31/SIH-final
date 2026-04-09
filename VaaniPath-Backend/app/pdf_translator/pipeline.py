
"""
pdf_translator/pipeline.py  (v4 - final)
─────────────────────────────────────────
Handles:
  - Text-layer PDFs       → extract spans → merge into paragraphs → Groq translate → ReportLab rebuild
  - Scanned / image PDFs  → full-page raster → Tesseract OCR → Groq translate → re-render (fallback)
  - Embedded images       → extract → image pipeline OCR+translate → draw on top
  - Any source language   → auto-detected via langdetect
  - Background sampling   → margin-strip heuristic (no gray-box artifact)
"""

import io
import os
import re
import tempfile

import fitz  # PyMuPDF
from PIL import Image
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.image_translator.pipeline import groq_translate, translate_image

# ── Font registration ─────────────────────────────────────────────────────────
FONTS_DIR        = os.path.join(os.path.dirname(__file__), "fonts")
DEVANAGARI_LANGS = {"hi", "mr"}
_FONTS_REGISTERED: set[str] = set()

FONT_CANDIDATES = {
    "devanagari": [
        os.path.join(FONTS_DIR, "NotoSansDevanagari-Regular.ttf"),
        "C:/Windows/Fonts/Nirmala.ttf",
        "C:/Windows/Fonts/NirmalaS.ttf",
    ],
    "latin": [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ],
}


def _resolve_font_path(lang: str) -> str | None:
    pool = (
        FONT_CANDIDATES["devanagari"] + FONT_CANDIDATES["latin"]
        if lang in DEVANAGARI_LANGS
        else FONT_CANDIDATES["latin"]
    )
    for f in pool:
        if os.path.exists(f):
            return f
    return None


def _register_font(lang: str) -> str:
    face = "NotoDevanagari" if lang in DEVANAGARI_LANGS else "ArialLatin"
    if face in _FONTS_REGISTERED:
        return face
    path = _resolve_font_path(lang)
    if path:
        try:
            pdfmetrics.registerFont(TTFont(face, path))
            _FONTS_REGISTERED.add(face)
            print(f"[pdf_pipeline] Registered '{face}' → {path}")
            return face
        except Exception as e:
            print(f"[pdf_pipeline] Font registration failed: {e}")
    return "Helvetica"


# ── Language detection ────────────────────────────────────────────────────────

def _detect_source_lang(text: str) -> str:
    try:
        from langdetect import detect
        return re.sub(r"-.*", "", detect(text) or "en")
    except Exception:
        return "en"


# ── Text extraction (paragraph-aware, hyperlink-gap fixed) ────────────────────

def _extract_paragraph_blocks(page: fitz.Page) -> list[dict]:
    """
    Merge all spans within each PDF block into one paragraph string.
    Eliminates gaps caused by hyperlinks, bold/italic span splits.
    Returns [] if the page has no extractable text layer (scanned PDF).
    """
    raw    = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)
    pw     = page.rect.width
    result = []

    for block in raw.get("blocks", []):
        if block.get("type") != 0:
            continue

        lines = block.get("lines", [])
        if not lines:
            continue

        all_font_sizes = []
        dominant_color = 0
        line_texts     = []

        for line in lines:
            span_texts = []
            for span in line.get("spans", []):
                t  = span.get("text", "")
                fs = span.get("size", 11)
                c  = span.get("color", 0)
                if t.strip():
                    span_texts.append(t)
                    all_font_sizes.append(fs)
                    if dominant_color == 0 and c != 0:
                        dominant_color = c
            merged = " ".join(span_texts).strip()
            if merged:
                line_texts.append(merged)

        full_text = re.sub(r" {2,}", " ", " ".join(line_texts)).strip()
        if not full_text or len(full_text) < 3:
            continue

        bx0, by0, bx1, by1 = block["bbox"]

        if (bx1 - bx0) > pw * 0.92 and len(full_text.split()) < 3:
            continue
        if (bx1 - bx0) < 20 or (by1 - by0) < 6:
            continue

        if all_font_sizes:
            sorted_fs = sorted(all_font_sizes)
            median_fs = sorted_fs[len(sorted_fs) // 2]
        else:
            median_fs = 11.0

        r = (dominant_color >> 16) & 0xFF
        g = (dominant_color >> 8)  & 0xFF
        b = dominant_color         & 0xFF

        result.append({
            "text":      full_text,
            "x0":        bx0,
            "y0":        by0,
            "x1":        bx1,
            "y1":        by1,
            "font_size": round(median_fs, 1),
            "color":     (r, g, b),
            "num_lines": len(lines),
        })

    return result


# ── Background color sampling (margin-strip heuristic) ───────────────────────

def _sample_margin_bg(
    pix_img: Image.Image,
    x0: float, y0: float, x1: float, y1: float,
    page_w: float, page_h: float,
    scale: float,
    margin_px: int = 6,
) -> tuple[int, int, int]:
    """
    Sample background from the gutter BESIDE the text block, not under it.
    Tries left strip → right strip → top-left page corner as fallback.
    """
    img_w, img_h = pix_img.size

    def clamp(v, lo, hi):
        return max(lo, min(v, hi))

    def median_rgb(region: Image.Image) -> tuple[int, int, int]:
        pixels = list(region.convert("RGB").getdata())
        if not pixels:
            return (255, 255, 255)
        n  = len(pixels)
        rs = sorted(p[0] for p in pixels)
        gs = sorted(p[1] for p in pixels)
        bs = sorted(p[2] for p in pixels)
        return (rs[n // 2], gs[n // 2], bs[n // 2])

    def looks_like_page_bg(color: tuple) -> bool:
        r, g, b = color
        is_near_white = r > 200 and g > 200 and b > 200
        is_near_gray  = abs(r - g) < 20 and abs(g - b) < 20
        return is_near_white or is_near_gray

    px0   = int(x0 * scale)
    py0   = clamp(int(y0 * scale), 0, img_h)
    py1   = clamp(int(y1 * scale), 0, img_h)
    px1   = int(x1 * scale)

    # Option 1: strip left of block
    lx1 = clamp(px0 - 2, 0, img_w)
    lx0 = clamp(lx1 - margin_px * 3, 0, img_w)
    if lx1 > lx0 and py1 > py0:
        color = median_rgb(pix_img.crop((lx0, py0, lx1, py1)))
        if looks_like_page_bg(color):
            return color

    # Option 2: strip right of block
    rx0 = clamp(px1 + 2, 0, img_w)
    rx1 = clamp(rx0 + margin_px * 3, 0, img_w)
    if rx1 > rx0 and py1 > py0:
        color = median_rgb(pix_img.crop((rx0, py0, rx1, py1)))
        if looks_like_page_bg(color):
            return color

    # Option 3: top-left page corner (almost always the page background)
    corner = pix_img.crop((0, 0, min(30, img_w), min(30, img_h)))
    return median_rgb(corner)


def _text_color_for_bg(bg: tuple[int, int, int]) -> tuple[int, int, int]:
    r, g, b   = bg
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    return (0, 0, 0) if luminance > 128 else (255, 255, 255)


# ── Text wrapping + font fitting ──────────────────────────────────────────────

def _wrap_text(
    c: rl_canvas.Canvas,
    text: str,
    font_face: str,
    font_size: float,
    box_w: float,
) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur   = ""
    for word in words:
        test = (cur + " " + word).strip() if cur else word
        try:
            w = c.stringWidth(test, font_face, font_size)
        except Exception:
            w = 0
        if w <= box_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines or [text]


def _fit_font_size(
    c: rl_canvas.Canvas,
    text: str,
    font_face: str,
    box_w: float,
    ideal_fs: float,
    box_h: float,
    min_fs: float = 6.0,
) -> float:
    fs = ideal_fs
    while fs >= min_fs:
        lines  = _wrap_text(c, text, font_face, fs, box_w)
        needed = len(lines) * fs * 1.25
        if needed <= box_h:
            return fs
        fs -= 0.5
    return min_fs


# ── Embedded image extraction + translation ───────────────────────────────────

def _extract_and_translate_images(
    page: fitz.Page,
    doc: fitz.Document,
    target_lang: str,
    tmp_dir: str,
) -> list[dict]:
    result   = []
    img_list = page.get_images(full=True)

    for img_info in img_list:
        xref  = img_info[0]
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        rect = rects[0]

        try:
            base_image = doc.extract_image(xref)
        except Exception as e:
            print(f"[pdf_pipeline] Cannot extract xref={xref}: {e}")
            continue

        img_bytes = base_image["image"]
        ext       = base_image.get("ext", "png")
        in_path   = os.path.join(tmp_dir, f"img_{xref}.{ext}")
        out_path  = os.path.join(tmp_dir, f"img_{xref}_translated.png")

        with open(in_path, "wb") as f:
            f.write(img_bytes)

        try:
            translate_image(
                input_path=in_path,
                output_path=out_path,
                target_lang=target_lang,
                source_lang="auto",
            )
            translated_path = out_path
        except Exception as e:
            print(f"[pdf_pipeline] Image translate failed xref={xref}: {e}")
            translated_path = in_path

        result.append({
            "xref":            xref,
            "x0":              rect.x0,
            "y0":              rect.y0,
            "x1":              rect.x1,
            "y1":              rect.y1,
            "translated_path": translated_path,
        })

    return result


# ── Scanned page fallback ─────────────────────────────────────────────────────

def _handle_scanned_page(
    c: rl_canvas.Canvas,
    pix_img: Image.Image,
    page_w: float,
    page_h: float,
    target_lang: str,
    source_lang: str,
    tmp_dir: str,
    page_num: int,
):
    """
    Fallback for pages with no extractable text layer (scanned PDFs).
    Runs the full-page raster through the existing image OCR+translate pipeline.
    The result is drawn as a full-page image on the canvas.
    """
    print(f"[pdf_pipeline] Page {page_num + 1}: no text layer → OCR fallback")

    full_page_path = os.path.join(tmp_dir, f"page_{page_num}_scan.png")
    out_page_path  = os.path.join(tmp_dir, f"page_{page_num}_scan_translated.png")

    pix_img.save(full_page_path)

    try:
        result = translate_image(
            input_path=full_page_path,
            output_path=out_page_path,
            target_lang=target_lang,
            source_lang=source_lang if source_lang != "auto" else "auto",
        )
        regions = result.get("regions_found", 0)
        print(f"[pdf_pipeline] OCR fallback: {regions} text region(s) found and translated")
        final_path = out_page_path
    except Exception as e:
        print(f"[pdf_pipeline] OCR fallback failed: {e} — keeping original page")
        final_path = full_page_path

    # Draw the translated (or original) page image filling the whole canvas page
    c.drawImage(
        final_path,
        0, 0,
        width=page_w,
        height=page_h,
        preserveAspectRatio=False,
    )


# ── Page rebuilder (text-layer path) ─────────────────────────────────────────

def _rebuild_page(
    c: rl_canvas.Canvas,
    text_blocks: list[dict],
    translations: list[str],
    images: list[dict],
    font_face: str,
    page_w: float,
    page_h: float,
    pix_img: Image.Image,
    scale: float,
):
    """
    Draw order:
      1. Text blocks  — erase original + draw translated text
      2. Images       — draw translated images on top (always visible)
    """

    # ── 1. Text blocks ────────────────────────────────────────────────────────
    for block, translated in zip(text_blocks, translations):
        x0    = block["x0"]
        y0    = block["y0"]
        x1    = block["x1"]
        y1    = block["y1"]
        fs    = block["font_size"]
        box_w = x1 - x0
        box_h = y1 - y0

        if box_w <= 2 or box_h <= 2:
            continue

        bg = _sample_margin_bg(pix_img, x0, y0, x1, y1, page_w, page_h, scale)
        fg = _text_color_for_bg(bg)

        # Erase original text
        rl_y = page_h - y1
        c.setFillColorRGB(bg[0] / 255, bg[1] / 255, bg[2] / 255)
        c.rect(x0 - 1, rl_y - 1, box_w + 2, box_h + 2, fill=1, stroke=0)

        # Fit + wrap translated text
        fitted_fs = _fit_font_size(c, translated, font_face, box_w, fs, box_h)
        lines     = _wrap_text(c, translated, font_face, fitted_fs, box_w)

        c.setFillColorRGB(fg[0] / 255, fg[1] / 255, fg[2] / 255)
        try:
            c.setFont(font_face, fitted_fs)
        except Exception:
            c.setFont("Helvetica", max(6.0, fitted_fs))

        line_spacing = fitted_fs * 1.25
        total_h      = len(lines) * line_spacing
        start_y      = y0 + (box_h - total_h) / 2 + fitted_fs

        for i, line_text in enumerate(lines):
            text_rl_y = page_h - (start_y + i * line_spacing)
            c.drawString(x0, text_rl_y, line_text)

    # ── 2. Translated images (on top) ─────────────────────────────────────────
    for img in images:
        x0, y0, x1, y1 = img["x0"], img["y0"], img["x1"], img["y1"]
        w = x1 - x0
        h = y1 - y0
        if w <= 0 or h <= 0:
            continue
        try:
            c.drawImage(
                img["translated_path"],
                x0, page_h - y1,
                width=w, height=h,
                preserveAspectRatio=False,
                mask="auto",
            )
        except Exception as e:
            print(f"[pdf_pipeline] drawImage failed: {e}")


# ── Page rasterizer ───────────────────────────────────────────────────────────

def _rasterize_page(page: fitz.Page, dpi: int = 150) -> tuple[Image.Image, float]:
    scale = dpi / 72
    mat   = fitz.Matrix(scale, scale)
    pix   = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
    img   = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    return img, scale


# ── Public entry point ────────────────────────────────────────────────────────

def translate_pdf(
    pdf_bytes:   bytes,
    target_lang: str,
    source_lang: str = "auto",
) -> bytes:
    """
    Translate a PDF to Hindi or Marathi and return the translated PDF as bytes.

    Handles both text-layer PDFs and scanned/image-only PDFs automatically.

    Args:
        pdf_bytes:   Raw bytes of the uploaded PDF.
        target_lang: "hi" (Hindi) or "mr" (Marathi).
        source_lang: ISO language code or "auto" for auto-detection.

    Returns:
        Translated PDF as raw bytes, ready for direct HTTP download.
    """
    print(f"[pdf_pipeline] Starting → target_lang={target_lang}, source_lang={source_lang}")

    doc       = fitz.open(stream=pdf_bytes, filetype="pdf")
    font_face = _register_font(target_lang)
    out_buf   = io.BytesIO()

    # Track detected source lang across pages (detect once, reuse)
    detected_source = source_lang

    with tempfile.TemporaryDirectory() as tmp_dir:
        c = rl_canvas.Canvas(out_buf)

        for page_num, page in enumerate(doc):
            print(f"[pdf_pipeline] ── Page {page_num + 1}/{len(doc)} ──")

            page_w = page.rect.width
            page_h = page.rect.height
            c.setPageSize((page_w, page_h))

            # 1. Rasterize page (used as background + for color sampling + OCR fallback)
            pix_img, scale = _rasterize_page(page, dpi=150)
            bg_path = os.path.join(tmp_dir, f"page_{page_num}_bg.png")
            pix_img.save(bg_path)

            # 2. Extract text blocks
            text_blocks = _extract_paragraph_blocks(page)

            # ── SCANNED PAGE — no text layer detected ─────────────────────────
            if not text_blocks:
                # Draw original page as background first
                c.drawImage(bg_path, 0, 0, width=page_w, height=page_h,
                            preserveAspectRatio=False)
                # Run full-page OCR + translate fallback
                _handle_scanned_page(
                    c=c,
                    pix_img=pix_img,
                    page_w=page_w,
                    page_h=page_h,
                    target_lang=target_lang,
                    source_lang=detected_source,
                    tmp_dir=tmp_dir,
                    page_num=page_num,
                )
                c.showPage()
                continue

            # ── TEXT-LAYER PAGE ───────────────────────────────────────────────

            # 3. Draw original page as background
            c.drawImage(bg_path, 0, 0, width=page_w, height=page_h,
                        preserveAspectRatio=False)

            # 4. Extract + translate embedded images (e.g. photos with text)
            translated_imgs = _extract_and_translate_images(
                page, doc, target_lang, tmp_dir
            )

            # 5. Auto-detect source language from first text-bearing page
            if detected_source == "auto":
                sample          = " ".join(b["text"] for b in text_blocks[:5])
                detected_source = _detect_source_lang(sample)
                print(f"[pdf_pipeline] Auto-detected source lang: {detected_source}")

            # 6. Batch translate all text blocks (one Groq call per page)
            texts        = [b["text"] for b in text_blocks]
            translations = groq_translate(texts, src=detected_source, tgt=target_lang)
            print(f"[pdf_pipeline] Translated {len(text_blocks)} block(s)")

            # 7. Rebuild page: text blocks first, images drawn on top
            _rebuild_page(
                c=c,
                text_blocks=text_blocks,
                translations=translations,
                images=translated_imgs,
                font_face=font_face,
                page_w=page_w,
                page_h=page_h,
                pix_img=pix_img,
                scale=scale,
            )

            c.showPage()

        c.save()

    doc.close()
    out_buf.seek(0)
    result = out_buf.read()
    print(f"[pdf_pipeline] Complete — {len(result):,} bytes")
    return result



#2
# """
# pdf_translator/pipeline.py
# ──────────────────────────
# Fixed version:
# - Merges spans into full paragraph blocks (fixes hyperlink gap issue)
# - Translates whole paragraphs instead of individual spans
# - Samples background color per region (no white-patch artifacts)
# - Proper font scaling and text wrapping within bounding boxes
# """

# import io
# import os
# import re
# import tempfile

# import fitz  # PyMuPDF
# from PIL import Image
# from reportlab.pdfgen import canvas as rl_canvas
# from reportlab.pdfbase import pdfmetrics
# from reportlab.pdfbase.ttfonts import TTFont

# from app.image_translator.pipeline import groq_translate, translate_image

# # ── Font registration ─────────────────────────────────────────────────────────
# FONTS_DIR        = os.path.join(os.path.dirname(__file__), "fonts")
# DEVANAGARI_LANGS = {"hi", "mr"}
# _FONTS_REGISTERED: set[str] = set()

# FONT_CANDIDATES = {
#     "devanagari": [
#         os.path.join(FONTS_DIR, "NotoSansDevanagari-Regular.ttf"),
#         "C:/Windows/Fonts/Nirmala.ttf",
#         "C:/Windows/Fonts/NirmalaS.ttf",
#     ],
#     "latin": [
#         "C:/Windows/Fonts/arial.ttf",
#         "C:/Windows/Fonts/calibri.ttf",
#         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
#         "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
#     ],
# }


# def _resolve_font_path(lang: str) -> str | None:
#     candidates = (
#         FONT_CANDIDATES["devanagari"] if lang in DEVANAGARI_LANGS
#         else FONT_CANDIDATES["latin"]
#     )
#     for f in candidates + FONT_CANDIDATES["latin"]:
#         if os.path.exists(f):
#             return f
#     return None


# def _register_font(lang: str) -> str:
#     face = "NotoDevanagari" if lang in DEVANAGARI_LANGS else "ArialLatin"
#     if face in _FONTS_REGISTERED:
#         return face
#     path = _resolve_font_path(lang)
#     if path:
#         try:
#             pdfmetrics.registerFont(TTFont(face, path))
#             _FONTS_REGISTERED.add(face)
#             print(f"[pdf_pipeline] Registered font '{face}' → {path}")
#             return face
#         except Exception as e:
#             print(f"[pdf_pipeline] Font registration failed: {e}")
#     return "Helvetica"


# # ── Language detection ────────────────────────────────────────────────────────

# def _detect_source_lang(text: str) -> str:
#     try:
#         from langdetect import detect
#         return re.sub(r"-.*", "", detect(text) or "en")
#     except Exception:
#         return "en"


# # ── Text block extraction (paragraph-aware) ───────────────────────────────────

# def _extract_paragraph_blocks(page: fitz.Page) -> list[dict]:
#     """
#     Extract text grouped at the paragraph/block level.

#     Key fix: merge ALL spans within a block into one string.
#     This eliminates the hyperlink-gap problem where linked words
#     were extracted as separate spans, leaving holes in the output.

#     Returns list of dicts:
#         { text, x0, y0, x1, y1, font_size, color, num_lines }
#     """
#     raw    = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)
#     pw     = page.rect.width
#     result = []

#     for block in raw.get("blocks", []):
#         if block.get("type") != 0:   # 0 = text, 1 = image
#             continue

#         lines = block.get("lines", [])
#         if not lines:
#             continue

#         # ── Merge all spans across all lines into one paragraph string ────
#         all_font_sizes  = []
#         dominant_color  = 0
#         line_texts      = []

#         for line in lines:
#             span_texts = []
#             for span in line.get("spans", []):
#                 t  = span.get("text", "")
#                 fs = span.get("size", 11)
#                 c  = span.get("color", 0)

#                 if t.strip():
#                     span_texts.append(t)
#                     all_font_sizes.append(fs)
#                     if dominant_color == 0 and c != 0:
#                         dominant_color = c

#             merged_line = " ".join(span_texts).strip()
#             if merged_line:
#                 line_texts.append(merged_line)

#         full_text = " ".join(line_texts)
#         full_text = re.sub(r" {2,}", " ", full_text).strip()

#         if not full_text or len(full_text) < 3:
#             continue

#         # ── Block bounding box ────────────────────────────────────────────
#         bx0, by0, bx1, by1 = block["bbox"]

#         # Skip full-width header/footer slivers with very little text
#         if (bx1 - bx0) > pw * 0.92 and len(full_text.split()) < 3:
#             continue
#         if (bx1 - bx0) < 20 or (by1 - by0) < 6:
#             continue

#         # ── Median font size ──────────────────────────────────────────────
#         if all_font_sizes:
#             sorted_fs = sorted(all_font_sizes)
#             median_fs = sorted_fs[len(sorted_fs) // 2]
#         else:
#             median_fs = 11.0

#         # ── Unpack color ──────────────────────────────────────────────────
#         r = (dominant_color >> 16) & 0xFF
#         g = (dominant_color >> 8)  & 0xFF
#         b = dominant_color         & 0xFF

#         result.append({
#             "text":      full_text,
#             "x0":        bx0,
#             "y0":        by0,
#             "x1":        bx1,
#             "y1":        by1,
#             "font_size": round(median_fs, 1),
#             "color":     (r, g, b),
#             "num_lines": len(lines),
#         })

#     return result


# # ── Background sampling from rasterized page ──────────────────────────────────

# def _sample_bg_color(
#     pix_img: Image.Image,
#     x0: float, y0: float, x1: float, y1: float,
#     scale: float,
# ) -> tuple[int, int, int]:
#     """
#     Sample median RGB of a bounding-box region from the rasterized page.
#     Using the raster (not PDF color data) correctly handles gradient and
#     image backgrounds that a plain white fill would miss.
#     """
#     import numpy as np

#     img_w, img_h = pix_img.size

#     px0 = max(0, int(x0 * scale))
#     py0 = max(0, int(y0 * scale))
#     px1 = min(img_w, int(x1 * scale))
#     py1 = min(img_h, int(y1 * scale))

#     if px1 <= px0 or py1 <= py0:
#         return (255, 255, 255)

#     region = pix_img.crop((px0, py0, px1, py1))
#     arr    = region.convert("RGB")
#     flat   = list(arr.getdata())
#     n      = len(flat)
#     if n == 0:
#         return (255, 255, 255)

#     med_r = sorted(p[0] for p in flat)[n // 2]
#     med_g = sorted(p[1] for p in flat)[n // 2]
#     med_b = sorted(p[2] for p in flat)[n // 2]
#     return (med_r, med_g, med_b)


# def _text_color_for_bg(bg: tuple[int, int, int]) -> tuple[int, int, int]:
#     r, g, b   = bg
#     luminance = 0.299 * r + 0.587 * g + 0.114 * b
#     return (0, 0, 0) if luminance > 128 else (255, 255, 255)


# # ── Text wrapping ─────────────────────────────────────────────────────────────

# def _wrap_text(
#     c: rl_canvas.Canvas,
#     text: str,
#     font_face: str,
#     font_size: float,
#     box_w: float,
# ) -> list[str]:
#     """Word-wrap text into lines that fit within box_w at the given font size."""
#     words = text.split()
#     lines: list[str] = []
#     cur   = ""

#     for word in words:
#         test = (cur + " " + word).strip() if cur else word
#         try:
#             w = c.stringWidth(test, font_face, font_size)
#         except Exception:
#             w = 0
#         if w <= box_w or not cur:
#             cur = test
#         else:
#             lines.append(cur)
#             cur = word

#     if cur:
#         lines.append(cur)

#     return lines or [text]


# def _fit_font_size(
#     c: rl_canvas.Canvas,
#     text: str,
#     font_face: str,
#     box_w: float,
#     ideal_fs: float,
#     box_h: float,
#     n_lines: int,
#     min_fs: float = 6.0,
# ) -> float:
#     """
#     Find the largest font size where the wrapped text fits within (box_w, box_h).
#     Tries from ideal_fs downward.
#     """
#     fs = ideal_fs
#     while fs >= min_fs:
#         lines  = _wrap_text(c, text, font_face, fs, box_w)
#         needed = len(lines) * fs * 1.25   # 1.25 line spacing
#         if needed <= box_h:
#             return fs
#         fs -= 0.5
#     return min_fs


# # ── Image extraction + translation ───────────────────────────────────────────

# def _extract_and_translate_images(
#     page: fitz.Page,
#     doc: fitz.Document,
#     target_lang: str,
#     tmp_dir: str,
# ) -> list[dict]:
#     result   = []
#     img_list = page.get_images(full=True)

#     for img_info in img_list:
#         xref  = img_info[0]
#         rects = page.get_image_rects(xref)
#         if not rects:
#             continue
#         rect = rects[0]

#         try:
#             base_image = doc.extract_image(xref)
#         except Exception as e:
#             print(f"[pdf_pipeline] Cannot extract image xref={xref}: {e}")
#             continue

#         img_bytes = base_image["image"]
#         ext       = base_image.get("ext", "png")
#         in_path   = os.path.join(tmp_dir, f"img_{xref}.{ext}")
#         out_path  = os.path.join(tmp_dir, f"img_{xref}_translated.png")

#         with open(in_path, "wb") as f:
#             f.write(img_bytes)

#         try:
#             translate_image(
#                 input_path=in_path,
#                 output_path=out_path,
#                 target_lang=target_lang,
#                 source_lang="auto",
#             )
#             translated_path = out_path
#         except Exception as e:
#             print(f"[pdf_pipeline] Image translation failed xref={xref}: {e}")
#             translated_path = in_path

#         result.append({
#             "xref":            xref,
#             "x0":              rect.x0,
#             "y0":              rect.y0,
#             "x1":              rect.x1,
#             "y1":              rect.y1,
#             "translated_path": translated_path,
#         })

#     return result


# # ── Page rebuilder ────────────────────────────────────────────────────────────

# def _rebuild_page(
#     c: rl_canvas.Canvas,
#     text_blocks: list[dict],
#     translations: list[str],
#     images: list[dict],
#     font_face: str,
#     page_w: float,
#     page_h: float,
#     pix_img: Image.Image,
#     scale: float,
# ):
#     """
#     Overlay translated content on the canvas page.
#     PDF coords: origin = bottom-left  →  rl_y = page_h - mupdf_y
#     """

#     # ── Draw translated images ────────────────────────────────────────────────
#     for img in images:
#         x0, y0, x1, y1 = img["x0"], img["y0"], img["x1"], img["y1"]
#         w = x1 - x0
#         h = y1 - y0
#         if w <= 0 or h <= 0:
#             continue
#         try:
#             c.drawImage(
#                 img["translated_path"],
#                 x0, page_h - y1,
#                 width=w, height=h,
#                 preserveAspectRatio=False,
#                 mask="auto",
#             )
#         except Exception as e:
#             print(f"[pdf_pipeline] drawImage failed: {e}")

#     # ── Draw translated text blocks ───────────────────────────────────────────
#     for block, translated in zip(text_blocks, translations):
#         x0   = block["x0"]
#         y0   = block["y0"]
#         x1   = block["x1"]
#         y1   = block["y1"]
#         fs   = block["font_size"]
#         n_ln = block["num_lines"]

#         box_w = x1 - x0
#         box_h = y1 - y0

#         if box_w <= 2 or box_h <= 2:
#             continue

#         # ── Sample background and pick contrasting text color ─────────────
#         bg  = _sample_bg_color(pix_img, x0, y0, x1, y1, scale)
#         fg  = _text_color_for_bg(bg)

#         # ── Erase original text region with background color ──────────────
#         rl_y = page_h - y1
#         c.setFillColorRGB(bg[0] / 255, bg[1] / 255, bg[2] / 255)
#         # Slight padding so we don't leave original character edges
#         c.rect(x0 - 1, rl_y - 1, box_w + 2, box_h + 2, fill=1, stroke=0)

#         # ── Find best font size for translated text to fit the box ────────
#         fitted_fs = _fit_font_size(
#             c, translated, font_face,
#             box_w=box_w, ideal_fs=fs,
#             box_h=box_h, n_lines=n_ln,
#         )

#         # ── Wrap text into lines ──────────────────────────────────────────
#         lines = _wrap_text(c, translated, font_face, fitted_fs, box_w)

#         # ── Draw each line ────────────────────────────────────────────────
#         c.setFillColorRGB(fg[0] / 255, fg[1] / 255, fg[2] / 255)
#         try:
#             c.setFont(font_face, fitted_fs)
#         except Exception:
#             c.setFont("Helvetica", max(6.0, fitted_fs))

#         line_spacing = fitted_fs * 1.25
#         total_h      = len(lines) * line_spacing

#         # Vertically center the text block within the bounding box
#         start_y = y0 + (box_h - total_h) / 2 + fitted_fs

#         for i, line_text in enumerate(lines):
#             # Convert top-down mupdf y → bottom-up reportlab y
#             text_rl_y = page_h - (start_y + i * line_spacing)
#             c.drawString(x0, text_rl_y, line_text)


# # ── Page rasterizer ───────────────────────────────────────────────────────────

# def _rasterize_page(page: fitz.Page, dpi: int = 150) -> tuple[Image.Image, float]:
#     scale = dpi / 72
#     mat   = fitz.Matrix(scale, scale)
#     pix   = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
#     img   = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
#     return img, scale


# # ── Public entry point ────────────────────────────────────────────────────────

# def translate_pdf(
#     pdf_bytes:   bytes,
#     target_lang: str,
#     source_lang: str = "auto",
# ) -> bytes:
#     """
#     Translate a PDF document.

#     Args:
#         pdf_bytes:   Raw bytes of uploaded PDF.
#         target_lang: "hi" (Hindi) or "mr" (Marathi).
#         source_lang: ISO lang code or "auto".

#     Returns:
#         Translated PDF as bytes, ready to send as HTTP response.
#     """
#     print(f"[pdf_pipeline] Starting → target_lang={target_lang}")

#     doc       = fitz.open(stream=pdf_bytes, filetype="pdf")
#     font_face = _register_font(target_lang)
#     out_buf   = io.BytesIO()

#     with tempfile.TemporaryDirectory() as tmp_dir:
#         c = rl_canvas.Canvas(out_buf)

#         for page_num, page in enumerate(doc):
#             print(f"[pdf_pipeline] Page {page_num + 1}/{len(doc)}")

#             page_w = page.rect.width
#             page_h = page.rect.height
#             c.setPageSize((page_w, page_h))

#             # 1. Rasterize page → use as background + for color sampling
#             pix_img, scale = _rasterize_page(page, dpi=150)
#             bg_path = os.path.join(tmp_dir, f"page_{page_num}_bg.png")
#             pix_img.save(bg_path)
#             c.drawImage(bg_path, 0, 0, width=page_w, height=page_h,
#                         preserveAspectRatio=False)

#             # 2. Extract + translate embedded images
#             translated_imgs = _extract_and_translate_images(
#                 page, doc, target_lang, tmp_dir
#             )

#             # 3. Extract paragraph-level text blocks
#             text_blocks = _extract_paragraph_blocks(page)
#             if not text_blocks:
#                 c.showPage()
#                 continue

#             # 4. Auto-detect source language from first page
#             if page_num == 0 and source_lang == "auto":
#                 sample      = " ".join(b["text"] for b in text_blocks[:5])
#                 source_lang = _detect_source_lang(sample)
#                 print(f"[pdf_pipeline] Detected source: {source_lang}")

#             # 5. Batch translate all blocks in one Groq call per page
#             texts        = [b["text"] for b in text_blocks]
#             translations = groq_translate(texts, src=source_lang, tgt=target_lang)

#             # 6. Rebuild page
#             _rebuild_page(
#                 c=c,
#                 text_blocks=text_blocks,
#                 translations=translations,
#                 images=translated_imgs,
#                 font_face=font_face,
#                 page_w=page_w,
#                 page_h=page_h,
#                 pix_img=pix_img,
#                 scale=scale,
#             )

#             c.showPage()

#         c.save()

#     doc.close()
#     out_buf.seek(0)
#     result = out_buf.read()
#     print(f"[pdf_pipeline] Done — {len(result):,} bytes")
#     return result


#1

# """
# pdf_translator/pipeline.py
# ──────────────────────────
# Document localization pipeline for PDFs.
# - Extracts text blocks (with positions) and images from each page
# - Translates text blocks via Groq (reuses groq_translate from image pipeline)
# - For embedded images: delegates to translate_image() from image pipeline
# - Rebuilds each page with ReportLab, preserving original layout
# - Returns a final PDF as bytes (no storage, direct download)
# """

# import io
# import os
# import re
# import tempfile
# import uuid

# import fitz  # PyMuPDF
# from PIL import Image
# from reportlab.lib.pagesizes import letter
# from reportlab.pdfgen import canvas as rl_canvas
# from reportlab.pdfbase import pdfmetrics
# from reportlab.pdfbase.ttfonts import TTFont

# # ── Re-use existing image translator ─────────────────────────────────────────
# from app.image_translator.pipeline import groq_translate, translate_image, get_font_path

# # ── Font registration ─────────────────────────────────────────────────────────
# FONTS_DIR = os.path.join(os.path.dirname(__file__), "fonts")
# _FONTS_REGISTERED: set[str] = set()

# DEVANAGARI_LANGS = {"hi", "mr"}

# FONT_CANDIDATES = {
#     "devanagari": [
#         os.path.join(FONTS_DIR, "NotoSansDevanagari-Regular.ttf"),
#         "C:/Windows/Fonts/Nirmala.ttf",
#         "C:/Windows/Fonts/NirmalaS.ttf",
#     ],
#     "latin": [
#         "C:/Windows/Fonts/arial.ttf",
#         "C:/Windows/Fonts/calibri.ttf",
#         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
#         "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
#     ],
# }


# def _resolve_font_path(lang: str) -> str | None:
#     candidates = FONT_CANDIDATES["devanagari"] if lang in DEVANAGARI_LANGS else FONT_CANDIDATES["latin"]
#     for f in candidates:
#         if os.path.exists(f):
#             return f
#     # last-resort: fall back to latin
#     for f in FONT_CANDIDATES["latin"]:
#         if os.path.exists(f):
#             return f
#     return None


# def _register_font(lang: str) -> str:
#     """Register font with ReportLab and return the face name."""
#     face = "NotoDevanagari" if lang in DEVANAGARI_LANGS else "ArialLatin"
#     if face in _FONTS_REGISTERED:
#         return face

#     path = _resolve_font_path(lang)
#     if path:
#         try:
#             pdfmetrics.registerFont(TTFont(face, path))
#             _FONTS_REGISTERED.add(face)
#             print(f"[pdf_pipeline] Registered font '{face}' from {path}")
#             return face
#         except Exception as e:
#             print(f"[pdf_pipeline] Font registration failed: {e}")

#     # Fallback to built-in Helvetica (Latin only — Devanagari will render as boxes)
#     return "Helvetica"


# # ── Helpers ───────────────────────────────────────────────────────────────────

# def _pdf_to_pil_page(page: fitz.Page, dpi: int = 150) -> Image.Image:
#     """Rasterize a PDF page to a PIL Image for image-based processing."""
#     mat = fitz.Matrix(dpi / 72, dpi / 72)
#     pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
#     return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)


# def _detect_source_lang(text: str) -> str:
#     try:
#         from langdetect import detect
#         lang = detect(text)
#         return re.sub(r"-.*", "", lang or "en")
#     except Exception:
#         return "en"


# # ── Text extraction ───────────────────────────────────────────────────────────

# def _extract_text_blocks(page: fitz.Page) -> list[dict]:
#     """
#     Extract text blocks from a page with their bounding boxes and font size.
#     Returns a list of dicts:
#         {text, x0, y0, x1, y1, font_size, color}
#     Coordinates are in PDF points (origin = top-left for our usage).
#     """
#     blocks = []
#     raw = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)

#     for block in raw.get("blocks", []):
#         if block.get("type") != 0:  # 0 = text block
#             continue
#         for line in block.get("lines", []):
#             for span in line.get("spans", []):
#                 text = span.get("text", "").strip()
#                 if not text or len(text) < 2:
#                     continue

#                 bbox = span["bbox"]  # (x0, y0, x1, y1)
#                 color_int = span.get("color", 0)
#                 # Convert packed int color → (r, g, b) 0-255
#                 r = (color_int >> 16) & 0xFF
#                 g = (color_int >> 8) & 0xFF
#                 b = color_int & 0xFF

#                 blocks.append({
#                     "text":      text,
#                     "x0":        bbox[0],
#                     "y0":        bbox[1],
#                     "x1":        bbox[2],
#                     "y1":        bbox[3],
#                     "font_size": round(span.get("size", 11), 1),
#                     "color":     (r, g, b),
#                 })

#     return blocks


# # ── Image extraction + translation ───────────────────────────────────────────

# def _extract_and_translate_images(
#     page: fitz.Page,
#     doc: fitz.Document,
#     target_lang: str,
#     tmp_dir: str,
# ) -> list[dict]:
#     """
#     Extract embedded images from a page, run image translation on each,
#     and return a list of dicts:
#         {xref, x0, y0, x1, y1, translated_path}
#     """
#     result = []
#     img_list = page.get_images(full=True)

#     for img_info in img_list:
#         xref = img_info[0]
#         rects = page.get_image_rects(xref)
#         if not rects:
#             continue
#         rect = rects[0]

#         # Extract raw image bytes
#         try:
#             base_image = doc.extract_image(xref)
#         except Exception as e:
#             print(f"[pdf_pipeline] Could not extract image xref={xref}: {e}")
#             continue

#         img_bytes = base_image["image"]
#         ext = base_image.get("ext", "png")

#         in_path  = os.path.join(tmp_dir, f"img_{xref}.{ext}")
#         out_path = os.path.join(tmp_dir, f"img_{xref}_translated.png")

#         with open(in_path, "wb") as f:
#             f.write(img_bytes)

#         try:
#             translate_image(
#                 input_path=in_path,
#                 output_path=out_path,
#                 target_lang=target_lang,
#                 source_lang="auto",
#             )
#             translated_path = out_path
#         except Exception as e:
#             print(f"[pdf_pipeline] Image translation failed for xref={xref}: {e}")
#             translated_path = in_path  # fallback: original image

#         result.append({
#             "xref":             xref,
#             "x0":               rect.x0,
#             "y0":               rect.y0,
#             "x1":               rect.x1,
#             "y1":               rect.y1,
#             "translated_path":  translated_path,
#         })

#     return result


# # ── Page rebuilder ────────────────────────────────────────────────────────────

# def _rebuild_page(
#     c: rl_canvas.Canvas,
#     page: fitz.Page,
#     text_blocks: list[dict],
#     translations: list[str],
#     images: list[dict],
#     font_face: str,
#     page_h: float,
# ):
#     """
#     Draw translated text blocks and translated images onto a ReportLab canvas page.
#     PDF coordinate system: origin at bottom-left.
#     PyMuPDF coordinate system: origin at top-left.
#     Conversion: rl_y = page_h - mupdf_y
#     """

#     # ── Draw translated images first (background layer) ──────────────────────
#     for img in images:
#         x0, y0, x1, y1 = img["x0"], img["y0"], img["x1"], img["y1"]
#         w = x1 - x0
#         h = y1 - y0
#         if w <= 0 or h <= 0:
#             continue
#         # Convert top-left origin → bottom-left origin
#         rl_y = page_h - y1
#         try:
#             c.drawImage(
#                 img["translated_path"],
#                 x0, rl_y, width=w, height=h,
#                 preserveAspectRatio=False,
#                 mask="auto",
#             )
#         except Exception as e:
#             print(f"[pdf_pipeline] Could not draw image: {e}")

#     # ── Draw translated text blocks ───────────────────────────────────────────
#     for block, translated in zip(text_blocks, translations):
#         x0, y0, y1 = block["x0"], block["y0"], block["y1"]
#         box_w = block["x1"] - x0
#         box_h = y1 - y0
#         fs    = block["font_size"]
#         r, g, b = block["color"]

#         # Whitewash the original text region with white rectangle
#         rl_y_top = page_h - y0
#         rl_y_bot = page_h - y1
#         c.setFillColorRGB(1, 1, 1)
#         c.rect(x0, rl_y_bot, box_w, box_h, fill=1, stroke=0)

#         # Fit font size to box width
#         target_fs = fs
#         try:
#             c.setFont(font_face, target_fs)
#             text_w = c.stringWidth(translated, font_face, target_fs)
#             if text_w > box_w and text_w > 0:
#                 target_fs = max(6, int(fs * (box_w / text_w) * 0.95))
#         except Exception:
#             target_fs = max(6, int(fs * 0.85))

#         # Draw translated text
#         c.setFillColorRGB(r / 255, g / 255, b / 255)
#         try:
#             c.setFont(font_face, target_fs)
#         except Exception:
#             c.setFont("Helvetica", max(6, target_fs))

#         # Vertical center within the box
#         text_y = rl_y_bot + (box_h - target_fs) / 2
#         c.drawString(x0, text_y, translated)


# # ── Main entry point ──────────────────────────────────────────────────────────

# def translate_pdf(
#     pdf_bytes: bytes,
#     target_lang: str,
#     source_lang: str = "auto",
# ) -> bytes:
#     """
#     Full pipeline:
#         pdf_bytes   → parse → translate text + images → rebuild PDF → return bytes

#     Args:
#         pdf_bytes:   Raw bytes of the uploaded PDF.
#         target_lang: ISO code — "hi" or "mr".
#         source_lang: ISO code or "auto" for auto-detection.

#     Returns:
#         Translated PDF as raw bytes (ready to stream to client).
#     """
#     print(f"[pdf_pipeline] Starting translation → {target_lang}")

#     doc = fitz.open(stream=pdf_bytes, filetype="pdf")
#     font_face = _register_font(target_lang)

#     output_buf = io.BytesIO()

#     with tempfile.TemporaryDirectory() as tmp_dir:
#         c = rl_canvas.Canvas(output_buf)

#         for page_num, page in enumerate(doc):
#             print(f"[pdf_pipeline] Processing page {page_num + 1}/{len(doc)}")

#             page_w = page.rect.width
#             page_h = page.rect.height

#             c.setPageSize((page_w, page_h))

#             # ── Step 1: Render original page as background ────────────────
#             bg_img = _pdf_to_pil_page(page, dpi=150)
#             bg_path = os.path.join(tmp_dir, f"page_{page_num}_bg.png")
#             bg_img.save(bg_path)
#             c.drawImage(bg_path, 0, 0, width=page_w, height=page_h, preserveAspectRatio=False)

#             # ── Step 2: Extract + translate embedded images ───────────────
#             translated_imgs = _extract_and_translate_images(page, doc, target_lang, tmp_dir)

#             # ── Step 3: Extract text blocks ───────────────────────────────
#             text_blocks = _extract_text_blocks(page)

#             if not text_blocks:
#                 print(f"[pdf_pipeline] Page {page_num + 1}: no text found, keeping original")
#                 c.showPage()
#                 continue

#             # ── Step 4: Detect source language from first page's text ─────
#             if page_num == 0 and source_lang == "auto":
#                 all_text = " ".join(b["text"] for b in text_blocks)
#                 source_lang = _detect_source_lang(all_text)
#                 print(f"[pdf_pipeline] Auto-detected source lang: {source_lang}")

#             # ── Step 5: Translate all text blocks in one Groq call ────────
#             texts = [b["text"] for b in text_blocks]
#             translations = groq_translate(texts, src=source_lang, tgt=target_lang)

#             # ── Step 6: Rebuild page ──────────────────────────────────────
#             _rebuild_page(
#                 c=c,
#                 page=page,
#                 text_blocks=text_blocks,
#                 translations=translations,
#                 images=translated_imgs,
#                 font_face=font_face,
#                 page_h=page_h,
#             )

#             c.showPage()

#         c.save()

#     doc.close()
#     output_buf.seek(0)
#     print(f"[pdf_pipeline] Done. Output size: {output_buf.getbuffer().nbytes} bytes")
#     return output_buf.read()
