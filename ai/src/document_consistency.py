import re
from typing import Dict, Any, Optional, Tuple
from difflib import SequenceMatcher

# Comparison Thresholds
NAME_SIMILARITY_MATCH = 0.90
NAME_SIMILARITY_WARNING = 0.75

AREA_DIFF_MATCH = 0.01  # <= 1%
AREA_DIFF_WARNING = 0.05 # <= 5%

class DocumentConsistencyEngine:
    
    @staticmethod
    def extract_survey_no(text: str) -> Optional[str]:
        # Support Survey No, Survey Number, Sur. No, Sy No, etc.
        # Capture following alphanumeric string, tolerating hyphens.
        match = re.search(r"(?i)(?:survey|sur|sy)[\s\-\.]*n[ou][A-Za-z]*[\s\-\.:#]*([A-Za-z0-9\-]+(?:[ \t]+(?:[0-9]+[A-Za-z]*|[A-Za-z]{1,2})\b)?)", text)
        if match:
            return match.group(1).strip()
        return None

    @staticmethod
    def extract_owner_name(text: str) -> Optional[str]:
        # Support Owner, Owner Name, Owned By, Applicant, Name
        # Prefer same-line extraction.
        match = re.search(r"(?i)(?:owner|owner name|owned by|applicant|name)[\s\-\.:]*([A-Za-z\s\.,']+(?:Mr|Mrs|Ms|Shri)?[\w\s\.,']+)(?:\r|\n|$)", text)
        if match:
            val = match.group(1).strip()
            # Failsafe against extracting huge chunks
            if val and len(val) < 100:
                return val
        return None

    @staticmethod
    def extract_area(text: str) -> Tuple[Optional[float], Optional[str], Optional[str]]:
        # Support Area, Extent, Land Area, Total Extent, Size
        match = re.search(r"(?i)(?:area|extent|land area|total extent|size)[\s\-\.:]*([\d\,\.]+)[\s]*(acres?|hectares?|sqm|sq\s*m|square\s*meter|square\s*meters|sq\s*ft|square\s*feet)?", text)
        if match:
            raw_val = match.group(1).strip()
            unit = match.group(2).strip().lower() if match.group(2) else None
            try:
                # Safely parse numeric value, stripping unambiguous thousands separators
                val = float(raw_val.replace(',', ''))
                return val, unit, raw_val
            except ValueError:
                pass
        return None, None, None

    @staticmethod
    def extract_land_id(text: str) -> Optional[str]:
        # Support Land ID, Asset ID, Property ID
        match = re.search(r"(?i)(?:land\s*id|asset\s*id|property\s*id)[\s\-\.:#]*([A-Za-z0-9\-]+)", text)
        if match:
            return match.group(1).strip()
        return None

    @staticmethod
    def normalize_alphanumeric(val: str) -> str:
        if not val:
            return ""
        # Lowercase, remove whitespace and hyphens
        return re.sub(r'[\s\-]+', '', val).lower()

    @staticmethod
    def normalize_name(val: str) -> str:
        if not val:
            return ""
        val = val.lower()
        # Remove harmless punctuation
        val = re.sub(r'[^\w\s]', '', val)
        # Remove common honorifics with word boundaries
        val = re.sub(r'\b(mr|mrs|ms|shri)\b', '', val)
        # Collapse repeated whitespace
        val = re.sub(r'\s+', ' ', val).strip()
        return val

    @staticmethod
    def fuzzy_match(val1: str, val2: str) -> float:
        if not val1 and not val2:
            return 1.0
        if not val1 or not val2:
            return 0.0
        return SequenceMatcher(None, val1, val2).ratio()

    @classmethod
    def compare_survey_no(cls, app_val: str, doc_text: str) -> dict:
        doc_val = cls.extract_survey_no(doc_text)
        if not doc_val:
            return {"application_value": app_val, "document_value": None, "result": "NOT_FOUND", "similarity": 0.0, "evidence": "Survey number not found in document."}
        
        norm_app = cls.normalize_alphanumeric(app_val)
        norm_doc = cls.normalize_alphanumeric(doc_val)
        
        if norm_app == norm_doc:
            return {"application_value": app_val, "document_value": doc_val, "result": "MATCH", "similarity": 1.0, "evidence": "Exact normalized match."}
        
        sim = cls.fuzzy_match(norm_app, norm_doc)
        if sim >= 0.80:
            return {"application_value": app_val, "document_value": doc_val, "result": "WARNING_SIMILAR", "similarity": sim, "evidence": "Slight formatting or OCR difference detected."}
        
        return {"application_value": app_val, "document_value": doc_val, "result": "MISMATCH", "similarity": sim, "evidence": "Clearly different survey numbers."}

    @classmethod
    def compare_land_id(cls, app_val: str, doc_text: str) -> dict:
        doc_val = cls.extract_land_id(doc_text)
        if not doc_val:
            return {"application_value": app_val, "document_value": None, "result": "NOT_FOUND", "similarity": 0.0, "evidence": "Land ID not found in document."}
        
        norm_app = cls.normalize_alphanumeric(app_val)
        norm_doc = cls.normalize_alphanumeric(doc_val)
        
        if norm_app == norm_doc:
            return {"application_value": app_val, "document_value": doc_val, "result": "MATCH", "similarity": 1.0, "evidence": "Exact normalized match."}
        
        sim = cls.fuzzy_match(norm_app, norm_doc)
        if sim >= 0.80:
            return {"application_value": app_val, "document_value": doc_val, "result": "WARNING_SIMILAR", "similarity": sim, "evidence": "Slight formatting or OCR difference detected."}
            
        return {"application_value": app_val, "document_value": doc_val, "result": "MISMATCH", "similarity": sim, "evidence": "Clearly different land IDs."}

    @classmethod
    def compare_owner_name(cls, app_val: str, doc_text: str) -> dict:
        doc_val = cls.extract_owner_name(doc_text)
        if not doc_val:
            return {"application_value": app_val, "document_value": None, "result": "NOT_FOUND", "similarity": 0.0, "evidence": "Owner name not found in document."}
            
        norm_app = cls.normalize_name(app_val)
        norm_doc = cls.normalize_name(doc_val)
        
        if norm_app == norm_doc:
            return {"application_value": app_val, "document_value": doc_val, "result": "MATCH", "similarity": 1.0, "evidence": "Exact normalized match."}
            
        sim = cls.fuzzy_match(norm_app, norm_doc)
        if sim >= NAME_SIMILARITY_MATCH:
            return {"application_value": app_val, "document_value": doc_val, "result": "MATCH", "similarity": sim, "evidence": "Very strong name similarity detected."}
        elif sim >= NAME_SIMILARITY_WARNING:
            return {"application_value": app_val, "document_value": doc_val, "result": "WARNING_SIMILAR", "similarity": sim, "evidence": "Moderate name similarity detected. Check for OCR spelling errors."}
        else:
            return {"application_value": app_val, "document_value": doc_val, "result": "MISMATCH", "similarity": sim, "evidence": "Clearly different owner names."}

    @classmethod
    def compare_area(cls, app_val: float, doc_text: str) -> dict:
        doc_val, doc_unit, raw_doc_val = cls.extract_area(doc_text)
        if doc_val is None:
            return {"application_value": app_val, "document_value": None, "document_unit": None, "result": "NOT_FOUND", "similarity": 0.0, "evidence": "Area not found in document."}
            
        diff = abs(app_val - doc_val) / max(app_val, 1e-9)
        sim = max(0.0, 1.0 - diff)
        
        base_res = {
            "application_value": app_val,
            "document_value": doc_val,
            "document_unit": doc_unit,
            "similarity": sim
        }
        
        if not doc_unit:
            base_res["result"] = "WARNING_SIMILAR"
            base_res["evidence"] = "Area numeric value extracted but unit is missing; manual verification required."
            return base_res
            
        # In a full implementation, unit mismatch logic goes here.
        # For now, evaluate numeric difference.
        
        if diff <= AREA_DIFF_MATCH:
            base_res["result"] = "MATCH"
            base_res["evidence"] = "Area is within 1% tolerance."
        elif diff <= AREA_DIFF_WARNING:
            base_res["result"] = "WARNING_SIMILAR"
            base_res["evidence"] = "Area is within 5% tolerance."
        else:
            base_res["result"] = "MISMATCH"
            base_res["evidence"] = f"Area differs by >5% ({diff*100:.1f}%)."
            
        return base_res

    @classmethod
    def analyze(cls, app_data: Dict[str, Any], doc_text: str) -> Dict[str, Any]:
        result = {
            "overall_consistency": "",
            "fields": {},
            "summary": {
                "matches": 0,
                "warnings": 0,
                "mismatches": 0,
                "not_found": 0
            }
        }
        
        if "survey_no" in app_data and app_data["survey_no"] is not None:
            result["fields"]["survey_no"] = cls.compare_survey_no(str(app_data["survey_no"]), doc_text)
            
        if "owner_name" in app_data and app_data["owner_name"] is not None:
            result["fields"]["owner_name"] = cls.compare_owner_name(str(app_data["owner_name"]), doc_text)
            
        if "area" in app_data and app_data["area"] is not None:
            result["fields"]["area"] = cls.compare_area(float(app_data["area"]), doc_text)
            
        if "land_id" in app_data and app_data["land_id"] is not None:
            result["fields"]["land_id"] = cls.compare_land_id(str(app_data["land_id"]), doc_text)
            
        for field, data in result["fields"].items():
            res = data["result"]
            if res == "MATCH":
                result["summary"]["matches"] += 1
            elif res == "WARNING_SIMILAR":
                result["summary"]["warnings"] += 1
            elif res == "MISMATCH":
                result["summary"]["mismatches"] += 1
            elif res == "NOT_FOUND":
                result["summary"]["not_found"] += 1
                
        # Overall rules
        if result["summary"]["mismatches"] > 0:
            result["overall_consistency"] = "MISMATCH"
        elif result["summary"]["warnings"] > 0:
            result["overall_consistency"] = "WARNING"
        elif result["summary"]["matches"] > 0:
            result["overall_consistency"] = "MATCH"
        else:
            result["overall_consistency"] = "NOT_FOUND"
            
        return result
