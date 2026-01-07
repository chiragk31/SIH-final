from fastapi import APIRouter, Depends, HTTPException, status, File, Form, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.api.deps import get_current_user
from app.db.supabase_client import supabase
from app.config import settings
import os
import requests
import io
import cloudinary.uploader
from datetime import datetime
from google.cloud import translate_v3 as translate
import json

# PDF Generation
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.utils import simpleSplit, ImageReader
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image

router = APIRouter()

# ==========================================
# SHARED HELPERS
# ==========================================

def get_gcp_project_id():
    key_path = "gcp_key.json"
    if not os.path.exists(key_path):
        # Fallback to absolute path from VaaniPath-Backend root if current dir is different
        key_path = os.path.join(os.getcwd(), "gcp_key.json")
    
    if os.path.exists(key_path):
        with open(key_path, "r") as f:
            data = json.load(f)
            return data.get("project_id")
    return None

def register_fonts():
    """Download and register Indic-supporting font (NotoSansDevanagari)."""
    font_path = "NotoSansDevanagari-Regular.ttf"
    try:
        if "Indic" in pdfmetrics.getRegisteredFontNames():
            return "Indic"
            
        if not os.path.exists(font_path):
            print("Downloading NotoSansDevanagari font...")
            url = "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf"
            r = requests.get(url)
            with open(font_path, "wb") as f:
                f.write(r.content)
        
        pdfmetrics.registerFont(TTFont('Indic', font_path))
        print("Registered font 'Indic'")
        return "Indic"
    except Exception as e:
        print(f"Font registration failed: {e}. Falling back to Helvetica.")
        return "Helvetica"

# ==========================================
# STANDARD DOCUMENT TRANSLATION (Original API)
# ==========================================

class DocumentTranslationRequest(BaseModel):
    document_id: str
    target_language: str

class DocumentTranslationResponse(BaseModel):
    id: str
    original_doc_id: str
    target_language: str
    translated_pdf_url: str
    created_at: datetime
    status: str

@router.post("/translate", response_model=DocumentTranslationResponse)
async def translate_document(
    request: DocumentTranslationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Standard Translation: Downloads PDF, translates text (via GCP), and regenerates PDF.
    Preserves basic text flow but maybe not exact complex layout.
    """
    # 1. Verify Document Exists
    doc_response = supabase.table("videos").select("*").eq("id", request.document_id).single().execute()
    if not doc_response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = doc_response.data
    file_url = document.get("file_url")
    if not file_url:
        raise HTTPException(status_code=400, detail="Document has no file URL")

    # 2. Check if translation already exists
    existing = supabase.table("translations")\
        .select("*")\
        .eq("video_id", request.document_id)\
        .eq("language", request.target_language)\
        .execute()
    
    if existing.data and existing.data[0].get("video_url"):
        # Return existing translation
        trans = existing.data[0]
        return {
            "id": trans["id"],
            "original_doc_id": trans["video_id"],
            "target_language": trans["language"],
            "translated_pdf_url": trans["video_url"],
            "created_at": trans["created_at"],
            "status": trans["status"]
        }

    # 3. Setup Google Cloud Client
    gcp_project_id = get_gcp_project_id()
    if not gcp_project_id:
        raise HTTPException(status_code=500, detail="Google Cloud credentials (project_id) not found")

    client = translate.TranslationServiceClient()
    parent = f"projects/{gcp_project_id}/locations/global"

    # 4. Download Source PDF
    try:
        response = requests.get(file_url)
        response.raise_for_status()
        file_content = response.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download source document: {str(e)}")

    # 5. Call GCP Translate Document (Inline)
    try:
        # Determine mime type (application/pdf)
        mime_type = "application/pdf"
        
        document_input_config = {
            "content": file_content,
            "mime_type": mime_type,
        }

        # V3 Request
        gcp_request = {
            "parent": parent,
            "target_language_code": request.target_language,
            "document_input_config": document_input_config,
        }

        translation_response = client.translate_document(request=gcp_request)
        
        # Extract translated bytes
        translated_content = translation_response.document_translation.byte_stream_outputs[0]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Cloud Translation failed: {str(e)}")

    # 6. Upload Translated PDF to Cloudinary
    try:
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )

        upload_result = cloudinary.uploader.upload(
            file=io.BytesIO(translated_content),
            resource_type="raw", # Important for PDF usually, or "auto"
            folder=f"translations/{request.target_language}",
            public_id=f"{request.document_id}_{request.target_language}",
            format="pdf" # Force PDF extension
        )
        translated_url = upload_result.get("secure_url")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload translation to Cloudinary: {str(e)}")

    # 7. Save to Database (translations table)
    try:
        translation_record = {
            "video_id": request.document_id, # Linking to original doc
            "language": request.target_language,
            "video_url": translated_url, # Storing PDF URL here
            "status": "completed",
            "created_at": datetime.utcnow().isoformat()
        }
        
        db_res = supabase.table("translations").insert(translation_record).execute()
        if not db_res.data:
             raise HTTPException(status_code=500, detail="Failed to save translation record")
             
        saved = db_res.data[0]
        
        return {
            "id": saved["id"],
            "original_doc_id": saved["video_id"],
            "target_language": saved["language"],
            "translated_pdf_url": saved["video_url"],
            "created_at": saved["created_at"],
            "status": saved["status"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ==========================================
# PERFECT LAYOUT TRANSLATION MODELS & LOGIC
# ==========================================

class LayoutField(BaseModel):
    key: str
    x: float
    y: float
    fontSize: int = 12
    color: str = "#000000"
    width: Optional[float] = None # Optional max width for wrapping

class LayoutTemplate(BaseModel):
    pageSize: Dict[str, float] # {width, height}
    background_url: str
    fields: List[LayoutField]

class LayoutTranslationRequest(BaseModel):
    template: LayoutTemplate
    data_values: Dict[str, str] # {key: "Original Text"}
    target_language: str
    output_filename: str = "translated_document"

class LayoutTranslationResponse(BaseModel):
    pdf_url: str
    target_language: str
    status: str

def batch_translate_text(texts: List[str], target_language: str) -> List[str]:
    """Translates a list of strings using GCP V3."""
    if not texts:
        return []
        
    project_id = get_gcp_project_id()
    if not project_id:
        print("GCP Project ID not found, returning original text")
        return texts

    client = translate.TranslationServiceClient()
    parent = f"projects/{project_id}/locations/global"

    try:
        response = client.translate_text(
            request={
                "parent": parent,
                "contents": texts,
                "mime_type": "text/plain",
                "target_language_code": target_language,
            }
        )
        return [translation.translated_text for translation in response.translations]
    except Exception as e:
        print(f"Translation Error: {e}")
        return texts # Fallback to original

@router.post("/generate-layout-pdf", response_model=LayoutTranslationResponse)
async def generate_layout_pdf(
    request: LayoutTranslationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    🎨 **Generate Translated PDF with Perfect Layout**
    
    1. Translates input data values.
    2. Downloads background template image.
    3. Overlays translated text at exact coordinates.
    4. Uploads to Cloudinary.
    """
    
    # 1. Translate Values
    keys = list(request.data_values.keys())
    values = list(request.data_values.values())
    
    print(f"Translating {len(values)} fields to {request.target_language}...")
    translated_values_list = batch_translate_text(values, request.target_language)
    
    # Remap back to keys
    translated_data = dict(zip(keys, translated_values_list))
    
    # 2. Download Background Image
    bg_image_bytes = None
    try:
        print(f"Downloading background: {request.template.background_url}")
        bg_resp = requests.get(request.template.background_url)
        bg_resp.raise_for_status()
        bg_image_bytes = io.BytesIO(bg_resp.content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download background image: {e}")

    # 3. Generate PDF
    try:
        buffer = io.BytesIO()
        width = request.template.pageSize.get("width", 595)
        height = request.template.pageSize.get("height", 842)
        
        c = canvas.Canvas(buffer, pagesize=(width, height))
        
        # Draw Background
        # ImageReader handles sizing better
        bg_img = ImageReader(bg_image_bytes)
        c.drawImage(bg_img, 0, 0, width=width, height=height)
        
        # Register Font (Indic)
        font_name = register_fonts()
        
        # Draw Fields
        for field in request.template.fields:
            if field.key in translated_data:
                text = translated_data[field.key]
                
                c.setFont(font_name, field.fontSize)
                c.setFillColor(HexColor(field.color))
                
                # Check for wrapping if width provided
                if field.width:
                    # TODO: Simple wrapping logic if needed
                    pass
                
                # Draw
                # Note: ReportLab coords are bottom-left (0,0). 
                # If template assumes top-left (web standard), flipping might be needed.
                # Ideally, the template creator sends PDF coordinates.
                # Assuming PDF coordinates (y=0 is bottom) for now based on POC.
                c.drawString(field.x, field.y, text)

        c.save()
        buffer.seek(0)
        pdf_bytes = buffer.getvalue()
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF Generation failed: {e}")

    # 4. Upload to Cloudinary
    try:
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )

        upload_result = cloudinary.uploader.upload(
            file=io.BytesIO(pdf_bytes),
            resource_type="raw", 
            folder=f"translated_docs/{request.target_language}",
            public_id=f"{request.output_filename}_{request.target_language}_{int(datetime.utcnow().timestamp())}",
            format="pdf"
        )
        final_url = upload_result.get("secure_url")
        
        return LayoutTranslationResponse(
            pdf_url=final_url,
            target_language=request.target_language,
            status="completed"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

@router.post("/translate-image")
async def translate_image_proxy(
    target_language: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Proxy image translation to n8n webhook.
    Avoids CORS issues and hides n8n logic.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Read file content
    content = await file.read()
    
    # Prepare request to n8n
    # Webhook: https://zaiddd.app.n8n.cloud/webhook/image-localizer?lang={target_language}
    n8n_url = f"https://zaiddd.app.n8n.cloud/webhook/image-localizer?lang={target_language}"
    
    try:
        # Send RAW BINARY to n8n (as requested)
        # The body of the POST request will be the file bytes directly.
        headers = {
            "Content-Type": file.content_type or "application/octet-stream"
        }
        
        print(f"Proxying image to n8n: {len(content)} bytes, type: {file.content_type}")
        # Added timeout to prevent hanging forever
        response = requests.post(n8n_url, data=content, headers=headers, timeout=60) 
        print(f"n8n response: {response.status_code}")
        
        if response.status_code != 200:
             print(f"n8n Error: {response.status_code} - {response.text}")
             raise HTTPException(status_code=response.status_code, detail=f"Translation service failed: {response.text}")
             
        # Check response content type
        content_type = response.headers.get("Content-Type", "application/octet-stream")
        
        # Return the content directly (Proxy)
        return Response(content=response.content, media_type=content_type)

    except Exception as e:
        print(f"Proxy Error: {e}")
        raise HTTPException(status_code=500, detail=f"Translation proxy failed: {str(e)}")