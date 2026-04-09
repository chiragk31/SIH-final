import os
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse

from app.image_translator.pipeline import translate_image

image_translator_router = APIRouter()

BASE_DIR    = os.path.dirname(__file__)
UPLOAD_DIR  = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR  = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


@image_translator_router.post("/translate")
async def translate_image_endpoint(
    image:           UploadFile = File(...),
    target_language: str        = Form(...),
    source_language: str        = Form(default="auto"),
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported.")

    ALLOWED_LANGS = {"hi", "mr", "en"}
    if target_language not in ALLOWED_LANGS:
        raise HTTPException(status_code=400, detail=f"Unsupported language. Allowed: hi, mr, en")

    input_path  = os.path.join(UPLOAD_DIR, image.filename)
    output_name = f"translated_{image.filename}"
    output_path = os.path.join(OUTPUT_DIR, output_name)

    with open(input_path, "wb") as f:
        f.write(await image.read())

    try:
        result = translate_image(
            input_path=input_path,
            output_path=output_path,
            target_lang=target_language,
            source_lang=source_language,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

    return FileResponse(
        output_path,
        media_type="image/png",
        filename=output_name,
        headers={"X-Text-Regions": str(result.get("regions_found", 0))},
    )


@image_translator_router.get("/languages")
async def get_languages():
    return {
        "languages": [
            {"code": "en", "name": "English"},
            {"code": "hi", "name": "Hindi"},
            {"code": "mr", "name": "Marathi"},
        ]
    }
