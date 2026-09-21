# PRJ-126 AI Module: Land Asset Duplicate Detection

This module provides an AI-powered duplicate detection engine for land asset records using a Random Forest model.

## Folder Structure
- `api.py`: FastAPI production inference server.
- `requirements.txt`: Python dependencies.
- `INTEGRATION.md`: Backend API contract and integration guide.
- `src/`: Source code for feature engineering, training, and predicting.
- `models/`: Saved `random_forest_duplicate.pkl` and evaluation reports.
- `data/`: Generation scripts and local data.

## Setup
```bash
cd ai
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
```

## Running the Inference Server
```bash
uvicorn api:app --port 8000
```
This starts the `POST /predict` API locally. See `INTEGRATION.md` for request formats.

## Development & Training
To generate synthetic data and retrain the robust model:
```bash
cd src
python generate_robust_dataset.py
python run_robust_pipeline.py
```
