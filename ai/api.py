import sys
import os

# Ensure we can import from src directory regardless of where the script is run from
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

import uvicorn
from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional

from src.predict import DuplicateDetector
from src.ocr import OCRExtractor
from src.document_consistency import DocumentConsistencyEngine

app = FastAPI(
    title="PRJ-126 Duplicate Detection API",
    description="Inference API for pairwise land asset duplicate classification.",
    version="1.0.0"
)

# Initialize the detector globally (loads model once on startup)
try:
    detector = DuplicateDetector(model_path='../models/random_forest_duplicate.pkl')
except Exception as e:
    print(f"Failed to load model: {e}")
    # Will fail during predict instead of crashing app on boot if model is missing during tests

class LandAsset(BaseModel):
    asset_id: Optional[str] = None
    land_id: Optional[str] = None
    survey_no: Optional[str] = None
    owner_name: Optional[str] = None
    area: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    asset_type: Optional[str] = None
    description: Optional[str] = None

class PredictionRequest(BaseModel):
    asset_a: LandAsset
    asset_b: LandAsset

class ApplicationData(BaseModel):
    survey_no: Optional[str] = None
    owner_name: Optional[str] = None
    area: Optional[float] = None
    land_id: Optional[str] = None

class ConsistencyRequest(BaseModel):
    application: ApplicationData
    document_text: str

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Duplicate Detection API is running"}

@app.post("/predict")
def predict(req: PredictionRequest):
    try:
        dict_a = req.asset_a.dict()
        dict_b = req.asset_b.dict()
        result = detector.check_duplicate(dict_a, dict_b)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/consistency")
def check_consistency(req: ConsistencyRequest):
    try:
        app_data = req.application.dict()
        doc_text = req.document_text
        if not doc_text or not doc_text.strip():
            raise HTTPException(status_code=400, detail="document_text cannot be empty.")
            
        result = DocumentConsistencyEngine.analyze(app_data, doc_text)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Consistency check failed: {str(e)}")

@app.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
        
    ext = file.filename.split('.')[-1].lower()
    if ext not in ['pdf', 'jpg', 'jpeg', 'png']:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, JPEG, or PNG.")
        
    file_bytes = await file.read()
    
    # 5MB size limit
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB).")
        
    try:
        if ext == 'pdf':
            result = OCRExtractor.extract_from_pdf(file_bytes)
        else:
            result = OCRExtractor.extract_from_image(file_bytes)
            
        result["filename"] = file.filename
        result["document_type"] = ext
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)
