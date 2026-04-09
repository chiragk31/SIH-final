import os
import re
import pytesseract
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from groq import Groq

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ── Groq client ───────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
groq_client  = Groq(api_key=GROQ_API_KEY)

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
}

# ── Font paths ────────────────────────────────────────────────────────────────
FONTS_DIR        = os.path.join(os.path.dirname(__file__), "fonts")
DEVANAGARI_LANGS = {"hi", "mr"}

FALLBACK_FONTS = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "C:/Windows/Fonts/times.ttf",
    "C:/Windows/Fonts/verdana.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]


def get_font_path(lang: str = "en") -> str | None:
    if lang in DEVANAGARI_LANGS:
        candidates = [
            os.path.join(FONTS_DIR, "NotoSansDevanagari-Regular.ttf"),
            "C:/Windows/Fonts/Nirmala.ttf",
            "C:/Windows/Fonts/NirmalaS.ttf",
        ]
        for f in candidates:
            if os.path.exists(f):
                print(f"[pipeline] Using Devanagari font: {f}")
                return f

    for f in FALLBACK_FONTS:
        if os.path.exists(f):
            print(f"[pipeline] Using fallback font: {f}")
            return f

    return None


def detect_source_language(text: str) -> str:
    try:
        from langdetect import detect
        return detect(text) or "en"
    except Exception:
        return "en"


def groq_translate(texts: list[str], src: str, tgt: str) -> list[str]:
    if not texts:
        return []
    if src == tgt:
        return texts

    src_name = LANGUAGE_NAMES.get(src, src)
    tgt_name = LANGUAGE_NAMES.get(tgt, tgt)

    numbered = "\n".join(f"{i+1}. {t}" for i, t in enumerate(texts))

    prompt = f"""You are a professional translator. Translate the following texts from {src_name} to {tgt_name}.

Rules:
- Return ONLY the translated lines, numbered exactly the same way
- Do NOT add any explanation, notes, or extra text
- Keep the same numbering format: "1. ", "2. ", etc.
- Preserve names of people and places as-is
- If a line is already in {tgt_name}, keep it unchanged

Texts to translate:
{numbered}"""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2048,
        )

        raw = response.choices[0].message.content.strip()
        print(f"[pipeline] Groq raw response:\n{raw}")

        lines = raw.split("\n")
        results = []
        for i in range(len(texts)):
            found = None
            for line in lines:
                line = line.strip()
                if re.match(rf"^{i+1}[\.\)]\s+", line):
                    found = re.sub(rf"^{i+1}[\.\)]\s+", "", line).strip()
                    break
            if found:
                results.append(found)
            else:
                print(f"[pipeline] Could not parse translation for line {i+1}, using original")
                results.append(texts[i])

        return results

    except Exception as e:
        print(f"[pipeline] Groq translation error: {e}")
        return texts


def ocr_extract_regions(image_path: str):
    img = Image.open(image_path).convert("RGB")
    img_w, img_h = img.size

    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

    line_groups: dict[tuple, list] = {}
    n = len(data["text"])
    for i in range(n):
        word = data["text"][i].strip()
        if not word or int(data["conf"][i]) < 50:
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        line_groups.setdefault(key, []).append(i)

    regions = []
    for key, indices in line_groups.items():
        words = [data["text"][i] for i in indices]
        line_text = " ".join(words).strip()
        if not line_text:
            continue

        xs = [data["left"][i] for i in indices]
        ys = [data["top"][i] for i in indices]
        ws = [data["width"][i] for i in indices]
        hs = [data["height"][i] for i in indices]

        left   = min(xs)
        top    = min(ys)
        right  = max(x + w for x, w in zip(xs, ws))
        bottom = max(y + h for y, h in zip(ys, hs))
        width  = right - left
        height = bottom - top

        if width < 30 or height < 10:
            continue
        if len(line_text.strip()) <= 1:
            continue
        if width > img_w * 0.95:
            continue

        avg_h = sum(hs) / len(hs)
        font_size_est = max(10, int(avg_h * 0.85))

        regions.append({
            "text":      line_text,
            "left":      left,
            "top":       top,
            "width":     width,
            "height":    height,
            "font_size": font_size_est,
        })

    return img, regions


def sample_background_color(img: Image.Image, x, y, w, h) -> tuple:
    region = img.crop((x, y, x + w, y + h))
    flat   = np.array(region).reshape(-1, 3)
    return tuple(np.median(flat, axis=0).astype(int))


def get_text_color(bg: tuple) -> tuple:
    r, g, b = bg
    return (0, 0, 0) if (0.299 * r + 0.587 * g + 0.114 * b) > 128 else (255, 255, 255)


def fit_text_in_box(draw, text, font_path, box_w, box_h, max_font):
    lo, hi, best = 8, max_font, None
    while lo <= hi:
        mid = (lo + hi) // 2
        try:
            font = ImageFont.truetype(font_path, mid)
        except Exception:
            font = ImageFont.load_default()
        bbox = draw.textbbox((0, 0), text, font=font)
        if (bbox[2] - bbox[0]) <= box_w and (bbox[3] - bbox[1]) <= box_h:
            best = font
            lo   = mid + 1
        else:
            hi   = mid - 1
    return best


def reconstruct_image(img: Image.Image, regions: list,
                      translations: list[str], output_path: str,
                      target_lang: str = "en"):
    result    = img.copy()
    draw      = ImageDraw.Draw(result)
    font_path = get_font_path(lang=target_lang)

    for region, translated_text in zip(regions, translations):
        x, y, w, h = region["left"], region["top"], region["width"], region["height"]
        fs  = region["font_size"]
        bg  = sample_background_color(img, x, y, w, h)
        pad = max(2, int(h * 0.1))

        draw.rectangle([x - pad, y - pad, x + w + pad, y + h + pad], fill=bg)

        text_color = get_text_color(bg)

        if font_path:
            font = fit_text_in_box(draw, translated_text, font_path,
                                   w + pad * 2, h + pad * 2, fs + 4)
            if font is None:
                try:
                    font = ImageFont.truetype(font_path, max(8, fs - 4))
                except Exception:
                    font = ImageFont.load_default()
        else:
            font = ImageFont.load_default()

        bbox   = draw.textbbox((0, 0), translated_text, font=font)
        text_x = x + max(0, (w - (bbox[2] - bbox[0])) // 2)
        text_y = y + max(0, (h - (bbox[3] - bbox[1])) // 2)

        draw.text((text_x, text_y), translated_text, fill=text_color, font=font)

    result.save(output_path)


def translate_image(input_path: str, output_path: str,
                    target_lang: str, source_lang: str = "auto") -> dict:
    img, regions = ocr_extract_regions(input_path)

    if not regions:
        img.save(output_path)
        return {"regions_found": 0, "message": "No text detected in image."}

    all_text = " ".join(r["text"] for r in regions)
    if source_lang == "auto":
        source_lang = re.sub(r"-.*", "", detect_source_language(all_text))

    print(f"[pipeline] Detected source: {source_lang} → target: {target_lang}")
    print(f"[pipeline] Regions found: {len(regions)}")
    for r in regions:
        print(f"  → '{r['text']}'")

    texts        = [r["text"] for r in regions]
    translations = groq_translate(texts, src=source_lang, tgt=target_lang)

    print(f"[pipeline] Translations:")
    for orig, trans in zip(texts, translations):
        print(f"  '{orig}' → '{trans}'")

    reconstruct_image(img, regions, translations, output_path, target_lang=target_lang)

    return {
        "regions_found": len(regions),
        "source_lang":   source_lang,
        "target_lang":   target_lang,
    }


