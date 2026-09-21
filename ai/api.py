import sys
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

# Ensure we can import from src directory
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
from predict import DuplicateDetector

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

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)
