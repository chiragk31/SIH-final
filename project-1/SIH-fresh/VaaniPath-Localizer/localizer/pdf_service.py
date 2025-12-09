import os
import requests
import logging
import re
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT

# Setup logger
logger = logging.getLogger(__name__)

def translate_pdf_via_webhook(file_path: str, target_lang: str, output_dir: str) -> str:
    """
    Sends PDF to n8n webhook and regenerates a PDF with the response text.
    """
    webhook_url = "https://zaiddd.app.n8n.cloud/webhook/pdf-translate/"
    
    filename = os.path.basename(file_path)
    
    logger.info(f"Sending {filename} to webhook for translation to {target_lang}")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            params = {'lang': target_lang}
            
            response = requests.post(webhook_url, files=files, params=params, timeout=120)
            
        response.raise_for_status()
        
        try:
            data = response.json()
        except Exception:
            # Fallback 1: Strict=False for control characters
            try:
                logger.warning("Standard JSON parse failed, trying strict=False")
                data = json.loads(response.text, strict=False)
            except Exception:
                # Fallback 2: Regex extraction for severely malformed JSON (unescaped quotes/newlines)
                # Matches: "text": " <CAPTURE> " } (ignoring whitespace and potential trailing junk)
                logger.warning("Strict=False failed, trying Regex extraction")
                match = re.search(r'"text"\s*:\s*"(.*)"\s*}', response.text, re.DOTALL)
                if match:
                    data = {"text": match.group(1)}
                else:
                    logger.error(f"Failed to parse N8N response. Raw text: {response.text[:500]}")
                    raise ValueError(f"Invalid JSON from translation service. Raw: {response.text[:200]}")
        
        translated_text = data.get("text", "")
        # Remove JSON escape sequences if Regex captured them raw
        # (Though regex group capture doesn't automatically unescape \\n or \\")
        # We might need to unescape manually if regex was used.
        # Simple unescape for common chars:
        if isinstance(translated_text, str):
            translated_text = translated_text.replace('\\n', '\n').replace('\\"', '"')

        if not translated_text:
            raise ValueError("No text returned from translation service")
            
        # Generate Output PDF
        os.makedirs(output_dir, exist_ok=True)
        out_filename = f"translated_{target_lang}_{filename}"
        out_path = os.path.join(output_dir, out_filename)
        
        _create_formatted_pdf(translated_text, out_path)
        
        return out_path
        
    except Exception as e:
        logger.error(f"PDF Translation failed: {e}")
        raise e

def _create_formatted_pdf(text: str, output_path: str):
    """
    Creates a formatted PDF using ReportLab Platypus.
    This handles automatic text wrapping, pagination, and font substitution.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Font Registration
    font_name = 'Helvetica' # Footer/Header Fallback
    
    # List of fonts to try for Indic support
    # Found Nirmala.ttc on the system via dir check
    candidates = [
        ("Nirmala", "C:\\Windows\\Fonts\\Nirmala.ttc"), # TrueType Collection
        ("Nirmala", "C:\\Windows\\Fonts\\Nirmala.ttf"),
        ("Mangal", "C:\\Windows\\Fonts\\mangal.ttf"),
        ("Arial", "C:\\Windows\\Fonts\\arial.ttf")
    ]
    
    body_font = 'Helvetica'
    
    for name, path in candidates:
        if os.path.exists(path):
            try:
                # Use a unique name for registration to avoid conflicts
                reg_name = f"{name}_Custom"
                
                # Check for TTC
                if path.lower().endswith('.ttc'):
                    # Use subfontIndex=0 (usually Regular) for collections
                    pdfmetrics.registerFont(TTFont(reg_name, path, subfontIndex=0))
                else:
                    pdfmetrics.registerFont(TTFont(reg_name, path))
                    
                body_font = reg_name
                logger.info(f"Registered font: {reg_name} from {path}")
                break
            except Exception as e:
                logger.warning(f"Failed to register {path}: {e}")
        else:
            logger.debug(f"Font not found: {path}")

    styles = getSampleStyleSheet()
    
    # Create a custom style for the body text
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontName=body_font,
        fontSize=12,
        leading=18, # Increased leading for Indic scripts
        alignment=TA_LEFT,
        spaceAfter=12,
        wordWrap='CJK' # Helps with wrapping some non-latin scripts
    )

    story = []
    
    # Pre-process text: split by double newlines for paragraphs to keep structure
    paragraphs = text.replace('\r\n', '\n').split('\n')
    
    for para in paragraphs:
        if para.strip():
            # Paragraph handles wrapping automatically
            try:
                story.append(Paragraph(para.strip(), body_style))
                story.append(Spacer(1, 6))
            except Exception:
                # Fallback if Paragraph fails on weird chars, strictly sanitize? 
                # For now just skip or use simple string
                pass

    doc.build(story)
