import os
import joblib
import pandas as pd
from features import compute_pair_features

class DuplicateDetector:
    """
    Production inference module for PRJ-126 Land Asset duplicate detection.
    Reuses exactly the same feature extraction logic from the training phase.
    """
    
    def __init__(self, model_path='../models/random_forest_duplicate.pkl'):
        # Ensure path is relative to this file so it works from anywhere
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(base_dir, model_path)
        
        self.model_data = joblib.load(path)
        self.model = self.model_data['model']
        self.threshold = self.model_data['optimal_threshold']
        self.feature_cols = self.model_data['feature_cols']

    def _generate_reason(self, features, is_dup, prob):
        """Generates a human-readable explanation for the prediction."""
        if not is_dup:
            if prob > (self.threshold / 2):
                return "Low confidence match. Not enough similarity to mark as a duplicate."
            return "Distinct records based on low similarity scores."
            
        reasons = []
        if features.get('survey_similarity', 0) > 0.7:
            reasons.append("highly similar survey numbers")
        if features.get('owner_similarity', 0) > 0.8:
            reasons.append("similar owner names")
        if features.get('area_similarity', 0) > 0.9:
            reasons.append("near-identical areas")
        if features.get('location_similarity', 0) > 0.9:
            reasons.append("highly overlapping geographic locations")
            
        if reasons:
            return "Flagged as duplicate due to " + ", ".join(reasons) + "."
        return "Flagged as duplicate based on combined feature patterns."

    def check_duplicate(self, record1, record2):
        """
        Accepts two LandAsset dictionaries.
        Returns probability, boolean prediction, computed features, and explanation.
        """
        # 1. Compute features reusing the exact training logic (handles missing values internally)
        features = compute_pair_features(record1, record2)
        
        # 2. Arrange features in exactly the same order as training
        feature_values = []
        for col in self.feature_cols:
            val = features.get(col, 0.0)
            # Failsafe for unexpected NaNs from downstream code
            if pd.isna(val):
                val = 0.0
            feature_values.append(val)
            
        # 3. Create DataFrame (required to preserve feature names for sklearn)
        X = pd.DataFrame([feature_values], columns=self.feature_cols)
        
        # 4. Predict
        prob = self.model.predict_proba(X)[0, 1]
        is_dup = bool(prob >= self.threshold)
        
        # 5. Generate human-readable reason
        reason = self._generate_reason(features, is_dup, prob)
        
        return {
            "duplicate_probability": round(float(prob), 4),
            "is_duplicate": is_dup,
            "features": {k: round(v, 4) for k, v in features.items()},
            "reason": reason
        }
