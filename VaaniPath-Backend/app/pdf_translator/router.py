"""
pdf_translator/router.py
─────────────────────────
FastAPI router for document localization.
- POST /api/document-translator/translate  → streams translated PDF as download
- GET  /api/document-translator/languages  → supported languages
- GET  /api/document-translator/health     → sanity check

No Redis, no Celery, no cloud storage.
The translated PDF is returned directly in the HTTP response.
"""

import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response, JSONResponse

from app.pdf_translator.pipeline import translate_pdf

document_translator_router = APIRouter(tags=["Document Translator"])

ALLOWED_LANGS = {"hi", "mr"}
MAX_FILE_SIZE_MB = 20


# ─────────────────────────────────────────────────────────────────────────────
# POST /translate
# ─────────────────────────────────────────────────────────────────────────────

@document_translator_router.post("/translate")
async def translate_document(
    document:        UploadFile = File(...),
    target_language: str        = Form(...),
    source_language: str        = Form(default="auto"),
):
    """
    Upload a PDF and receive the translated PDF as a direct download.

    Form fields:
        document        — PDF file
        target_language — "hi" (Hindi) or "mr" (Marathi)
        source_language — ISO code or "auto" (default)

    Returns:
        application/pdf with Content-Disposition: attachment
    """
    # ── Validate file type ────────────────────────────────────────────────────
    content_type = document.content_type or ""
    filename = document.filename or "upload.pdf"

    if content_type != "application/pdf" and not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported. Please upload a .pdf file.",
        )

    # ── Validate language ─────────────────────────────────────────────────────
    if target_language not in ALLOWED_LANGS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported target language '{target_language}'. Allowed: {sorted(ALLOWED_LANGS)}",
        )

    # ── Read file bytes ───────────────────────────────────────────────────────
    pdf_bytes = await document.read()

    size_mb = len(pdf_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Maximum allowed: {MAX_FILE_SIZE_MB} MB.",
        )

    if len(pdf_bytes) < 5 or not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file does not appear to be a valid PDF.",
        )

    # ── Run translation pipeline ──────────────────────────────────────────────
    try:
        start = time.time()
        translated_bytes = translate_pdf(
            pdf_bytes=pdf_bytes,
            target_lang=target_language,
            source_lang=source_language,
        )
        elapsed = round(time.time() - start, 2)
        print(f"[router] Translation complete in {elapsed}s")
    except Exception as e:
        print(f"[router] Pipeline error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}",
        )

    # ── Build download filename ───────────────────────────────────────────────
    lang_suffix = {"hi": "hindi", "mr": "marathi"}.get(target_language, target_language)
    base_name   = filename.rsplit(".", 1)[0]
    out_name    = f"{base_name}_translated_{lang_suffix}.pdf"

    # ── Return as direct download (no storage needed) ─────────────────────────
    return Response(
        content=translated_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition":        f'attachment; filename="{out_name}"',
            "Content-Length":             str(len(translated_bytes)),
            "X-Translation-Target-Lang":  target_language,
            "X-Translation-Time-Seconds": str(elapsed),
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /languages
# ─────────────────────────────────────────────────────────────────────────────

@document_translator_router.get("/languages")
async def get_supported_languages():
    return JSONResponse({
        "supported_languages": [
            {"code": "hi", "name": "Hindi",   "script": "Devanagari"},
            {"code": "mr", "name": "Marathi",  "script": "Devanagari"},
        ],
        "note": "More languages can be added by extending ALLOWED_LANGS in the router."
    })


# ─────────────────────────────────────────────────────────────────────────────
# GET /health
# ─────────────────────────────────────────────────────────────────────────────

@document_translator_router.get("/health")
async def health_check():
    checks = {}

    # Check PyMuPDF
    try:
        import fitz
        checks["pymupdf"] = f"ok (version {fitz.version[0]})"
    except ImportError:
        checks["pymupdf"] = "MISSING — run: pip install pymupdf"

    # Check ReportLab
    try:
        import reportlab
        checks["reportlab"] = f"ok (version {reportlab.Version})"
    except ImportError:
        checks["reportlab"] = "MISSING — run: pip install reportlab"

    # Check Groq
    try:
        import groq
        checks["groq"] = "ok"
    except ImportError:
        checks["groq"] = "MISSING — run: pip install groq"

    # Check Devanagari font
    import os
    font_candidates = [
        os.path.join(os.path.dirname(__file__), "fonts", "NotoSansDevanagari-Regular.ttf"),
        "C:/Windows/Fonts/Nirmala.ttf",
        "C:/Windows/Fonts/NirmalaS.ttf",
    ]
    font_found = next((f for f in font_candidates if os.path.exists(f)), None)
    checks["devanagari_font"] = f"ok ({font_found})" if font_found else (
        "WARNING — Noto Sans Devanagari not found. "
        "Download from fonts.google.com and place in app/pdf_translator/fonts/"
    )

    all_ok = all("MISSING" not in v for v in checks.values())
    return JSONResponse(
        status_code=200 if all_ok else 503,
        content={"status": "ready" if all_ok else "degraded", "checks": checks},
    )
