import io
import fitz  # PyMuPDF
import pytesseract
from PIL import Image

# Sensible maximum page limit to avoid OCR DOS attacks on the server
MAX_PAGES_TO_PROCESS = 10

class OCRExtractor:
    @staticmethod
    def extract_from_pdf(file_bytes: bytes) -> dict:
        """
        Extracts text from a PDF.
        Tries embedded text first. If empty (scanned PDF), uses Tesseract OCR.
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            raise ValueError(f"Failed to open PDF: {str(e)}")

        page_count = min(len(doc), MAX_PAGES_TO_PROCESS)
        
        # 1. Attempt embedded text extraction
        embedded_text_parts = []
        for i in range(page_count):
            page = doc.load_page(i)
            text = page.get_text()
            if text:
                embedded_text_parts.append(text)
                
        combined_embedded = "\n".join(embedded_text_parts).strip()
        
        # If we got meaningful embedded text, assume it's a digital PDF
        if len(combined_embedded) > 50:
            return {
                "success": True,
                "extraction_method": "embedded_text",
                "page_count": page_count,
                "text": combined_embedded
            }
            
        # 2. Fallback to OCR if embedded text is missing or very sparse
        ocr_text_parts = []
        try:
            for i in range(page_count):
                page = doc.load_page(i)
                # Render page to an image
                pix = page.get_pixmap(dpi=300)
                # Convert to PIL Image
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                # Run Tesseract
                text = pytesseract.image_to_string(img)
                ocr_text_parts.append(text)
                
            combined_ocr = "\n".join(ocr_text_parts).strip()
            
            return {
                "success": True,
                "extraction_method": "ocr",
                "page_count": page_count,
                "text": combined_ocr
            }
        except Exception as e:
            raise RuntimeError(f"OCR failed. Is Tesseract installed and in PATH? Error: {str(e)}")
            
    @staticmethod
    def extract_from_image(file_bytes: bytes) -> dict:
        """
        Extracts text from an image (JPEG, PNG, etc.) using Tesseract OCR.
        """
        try:
            img = Image.open(io.BytesIO(file_bytes))
            # Convert to RGB in case of RGBA/P formats to avoid Tesseract issues
            if img.mode != 'RGB':
                img = img.convert('RGB')
        except Exception as e:
            raise ValueError(f"Failed to open image: {str(e)}")
            
        try:
            text = pytesseract.image_to_string(img)
            return {
                "success": True,
                "extraction_method": "ocr",
                "page_count": 1,
                "text": text.strip()
            }
        except Exception as e:
            raise RuntimeError(f"OCR failed. Is Tesseract installed and in PATH? Error: {str(e)}")
