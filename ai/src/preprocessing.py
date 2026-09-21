import re
import math
import pandas as pd
import numpy as np

def clean_text(text):
    """Lowercases, strips whitespace, and removes punctuation."""
    if not isinstance(text, str) or pd.isna(text):
        return ""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    return text

def clean_identifier(text):
    """Standardizes IDs (like survey numbers and land IDs) by removing common separators."""
    if not isinstance(text, str) or pd.isna(text):
        return ""
    text = text.upper().strip()
    # Keep only alphanumeric characters to ignore dashes, slashes, spaces
    text = re.sub(r'[^A-Z0-9]', '', text)
    return text

def safe_float(val):
    """Safely parses float values, handling missing data."""
    try:
        if pd.isna(val):
            return np.nan
        return float(val)
    except (ValueError, TypeError):
        return np.nan

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates geographical distance in kilometers between two lat/lon points."""
    if pd.isna(lat1) or pd.isna(lon1) or pd.isna(lat2) or pd.isna(lon2):
        return np.nan
    R = 6371.0 # Radius of the Earth in km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
