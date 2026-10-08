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

    # 3. Extract Endpoint
    print("\n[POST] /extract")
    pdf_path = "../backend/uploads/1cf09a59-c4a2-4f9c-8743-84e92baa08fd.pdf"
    import os
    if os.path.exists(pdf_path):
        import mimetypes
        import uuid
        
        boundary = uuid.uuid4().hex
        headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
        
        with open(pdf_path, 'rb') as f:
            pdf_data = f.read()
            
        body = bytearray()
        body.extend(f'--{boundary}\r\n'.encode('utf-8'))
        body.extend(f'Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n'.encode('utf-8'))
        body.extend(f'Content-Type: application/pdf\r\n\r\n'.encode('utf-8'))
        body.extend(pdf_data)
        body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))
        
        req = urllib.request.Request(f"{base_url}/extract", data=body, headers=headers)
        try:
            with urllib.request.urlopen(req) as response:
                print("Status Code:", response.getcode())
                print("Response:", response.read().decode('utf-8'))
        except Exception as e:
            if hasattr(e, 'read'):
                print("Extraction failed:", e.read().decode('utf-8'))
            else:
                print("Extraction failed:", e)
    else:
        print(f"Skipping /extract test, {pdf_path} not found.")

    # 4. Extract Endpoint - Unsupported
    print("\n[POST] /extract (Unsupported type)")
    boundary = "dummyboundary"
    headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}
    body = bytearray()
    body.extend(f'--{boundary}\r\n'.encode('utf-8'))
    body.extend(f'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n'.encode('utf-8'))
    body.extend(f'Content-Type: text/plain\r\n\r\n'.encode('utf-8'))
    body.extend(b'Hello World')
    body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))
    
    req = urllib.request.Request(f"{base_url}/extract", data=body, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.getcode())
    except urllib.error.HTTPError as e:
        print("Status Code:", e.code)
        print("Response:", e.read().decode('utf-8'))

    # 5. Consistency Endpoint - MATCH
    print("\n[POST] /consistency (MATCH)")
    payload_match = {
        "application": {
            "survey_no": "SUR-342",
            "owner_name": "Ubed",
            "area": 2.0,
            "land_id": "573E601D"
        },
        "document_text": "OFFICIAL LAND RECORD\nOwner Name: Ubed\nSurvey No.: sur342\nTotal Extent Area: 2.0 acres\nAsset ID: 573E-601D"
    }
    req = urllib.request.Request(f"{base_url}/consistency", data=json.dumps(payload_match).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.getcode())
            print("Response:", json.loads(response.read().decode('utf-8'))["overall_consistency"])
    except Exception as e:
        print("Consistency test failed:", e)

    # 6. Consistency Endpoint - WARNING
    print("\n[POST] /consistency (WARNING)")
    payload_warning = {
        "application": payload_match["application"],
        "document_text": "OFFICIAL LAND RECORD\nOwner Name: Uved\nSurvey No.: sur342\nTotal Extent Area: 2.0 acres\nAsset ID: 573E-601D"
    }
    req = urllib.request.Request(f"{base_url}/consistency", data=json.dumps(payload_warning).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.getcode())
            print("Response:", json.loads(response.read().decode('utf-8'))["overall_consistency"])
    except Exception as e:
        print("Consistency test failed:", e)

    # 7. Consistency Endpoint - MISMATCH
    print("\n[POST] /consistency (MISMATCH)")
    payload_mismatch = {
        "application": payload_match["application"],
        "document_text": "OFFICIAL LAND RECORD\nOwner Name: Ubed\nSurvey No.: sur342\nTotal Extent Area: 5.0 acres\nAsset ID: 573E-601D"
    }
    req = urllib.request.Request(f"{base_url}/consistency", data=json.dumps(payload_mismatch).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.getcode())
            print("Response:", json.loads(response.read().decode('utf-8'))["overall_consistency"])
    except Exception as e:
        print("Consistency test failed:", e)

    # 8. Consistency Endpoint - NOT_FOUND
    print("\n[POST] /consistency (NOT_FOUND)")
    payload_not_found = {
        "application": payload_match["application"],
        "document_text": "Just some random text without any of the fields."
    }
    req = urllib.request.Request(f"{base_url}/consistency", data=json.dumps(payload_not_found).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.getcode())
            print("Response:", json.loads(response.read().decode('utf-8'))["overall_consistency"])
    except Exception as e:
        print("Consistency test failed:", e)

    # 9. Consistency Endpoint - Invalid/Malformed (Empty doc text)
    print("\n[POST] /consistency (Malformed)")
    payload_malformed = {
        "application": payload_match["application"],
        "document_text": ""
    }
    req = urllib.request.Request(f"{base_url}/consistency", data=json.dumps(payload_malformed).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.getcode())
    except urllib.error.HTTPError as e:
        print("Status Code:", e.code)
        print("Response:", e.read().decode('utf-8'))

if __name__ == "__main__":
    main()
