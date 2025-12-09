import requests
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def create_dummy_pdf(filename="test_doc.pdf"):
    c = canvas.Canvas(filename, pagesize=A4)
    c.drawString(100, 750, "This is a test document for translation.")
    c.drawString(100, 730, "Please translate this to Hindi.")
    c.save()
    return filename

def test_endpoint():
    filename = "test_doc.pdf"
    if not os.path.exists(filename):
        print(f"Creating dummy PDF: {filename}")
        create_dummy_pdf(filename)
    else:
        print(f"Using existing PDF: {filename}")
    
    pdf_path = filename
    url = "http://localhost:8001/pdf/translate"
    files = {'file': open(pdf_path, 'rb')}
    data = {'target_lang': 'marwadi'}
    
    print(f"Sending {pdf_path} to {url}...")
    try:
        response = requests.post(url, files=files, data=data)
        if response.status_code == 200:
            output_filename = "translated_output.pdf"
            with open(output_filename, "wb") as f:
                f.write(response.content)
            print(f"SUCCESS: Received translated PDF saved to {output_filename}")
        else:
            print(f"FAILURE: Status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        files['file'].close()
        # Do not remove the file so user can inspect it or reuse it
        # if os.path.exists(pdf_path):
        #     os.remove(pdf_path)

if __name__ == "__main__":
    test_endpoint()
