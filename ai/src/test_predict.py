import json
from predict import DuplicateDetector

def main():
    detector = DuplicateDetector()
    
    print("=== PRJ-126 Duplicate Detection Inference Test ===\n")
    
    # 1. Clear Duplicate
    r1_dup = {
        "asset_id": "AST-001", "land_id": "LND-001", "survey_no": "SY-123/A",
        "owner_name": "John Doe", "area": 10.5, "latitude": 12.3456, 
        "longitude": 78.9101, "asset_type": "Agricultural", "description": "Farm land"
    }
    r2_dup = {
        "asset_id": "AST-002", "land_id": "LND-001-A", "survey_no": "SY 123-A",
        "owner_name": "Doe John", "area": 10.52, "latitude": 12.3457, 
        "longitude": 78.9100, "asset_type": "Agricultural", "description": "Farm land"
    }
    
    print("--- 1. Clear Duplicate Pair ---")
    res = detector.check_duplicate(r1_dup, r2_dup)
    print(json.dumps(res, indent=2))
    
    # 2. Clear Non-Duplicate
    r1_non = {
        "asset_id": "AST-003", "land_id": "LND-002", "survey_no": "SY-999",
        "owner_name": "Alice Smith", "area": 5.0, "latitude": 10.0000, 
        "longitude": 70.0000, "asset_type": "Commercial", "description": "Shop"
    }
    
    print("\n--- 2. Clear Non-Duplicate Pair ---")
    res = detector.check_duplicate(r1_dup, r1_non)
    print(json.dumps(res, indent=2))
    
    # 3. Hard Negative (Same owner, different land/survey)
    r1_hn = {
        "asset_id": "AST-004", "land_id": "LND-003", "survey_no": "SY-444",
        "owner_name": "John Doe", "area": 20.0, "latitude": 15.0000, 
        "longitude": 80.0000, "asset_type": "Residential", "description": "House"
    }
    
    print("\n--- 3. Hard Negative Pair (Same Owner) ---")
    res = detector.check_duplicate(r1_dup, r1_hn)
    print(json.dumps(res, indent=2))
    
    # 4. Missing Optional Fields (Only survey_no is shared)
    r1_miss = {
        "asset_id": "AST-005", "land_id": None, "survey_no": "SY-123/A",
        "owner_name": None, "area": None, "latitude": None, 
        "longitude": None, "asset_type": None, "description": None
    }
    r2_miss = {
        "asset_id": "AST-006", "land_id": "", "survey_no": "SY 123-A",
        "owner_name": "", "area": 10.5, "latitude": 12.34, 
        "longitude": 78.91, "asset_type": "", "description": ""
    }
    
    print("\n--- 4. Pair with Missing Fields ---")
    res = detector.check_duplicate(r1_miss, r2_miss)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
