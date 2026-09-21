import urllib.request
import json

def main():
    base_url = "http://127.0.0.1:8000"
    
    print("=== Testing PRJ-126 API ===")
    
    # 1. Health Endpoint
    print("\n[GET] /health")
    try:
        req = urllib.request.Request(f"{base_url}/health")
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.getcode())
            print("Response:", json.loads(response.read().decode('utf-8')))
    except Exception as e:
        print("Error: Could not connect to API. Is it running?", e)
        return
        
    # 2. Predict Endpoint
    print("\n[POST] /predict")
    payload = {
      "asset_a": {
        "asset_id": "AST-100",
        "land_id": "LND-100",
        "survey_no": "SY-888",
        "owner_name": "Sarah Connor",
        "area": 25.5,
        "latitude": 20.1234,
        "longitude": 80.5678,
        "asset_type": "Agricultural",
        "description": "Large farm"
      },
      "asset_b": {
        "asset_id": "AST-101",
        "land_id": "LND-100-DUP",
        "survey_no": "SY 888",
        "owner_name": "Connor Sarah",
        "area": 25.55,
        "latitude": 20.1235,
        "longitude": 80.5677,
        "asset_type": "Agricultural",
        "description": "Large farm"
      }
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f"{base_url}/predict", data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.getcode())
            print("Response:\n" + json.dumps(json.loads(response.read().decode('utf-8')), indent=2))
    except Exception as e:
        print("Prediction failed:", e)

if __name__ == "__main__":
    main()
