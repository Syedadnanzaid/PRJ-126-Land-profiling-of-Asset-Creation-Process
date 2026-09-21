import pandas as pd
import numpy as np
import math
import os
from difflib import SequenceMatcher
from preprocessing import clean_text, clean_identifier, safe_float, haversine_distance

def string_similarity(s1, s2):
    """Returns a similarity score between 0.0 and 1.0 for two strings."""
    if not s1 or not s2:
        return 0.0
    return SequenceMatcher(None, s1, s2).ratio()

def owner_similarity_score(o1, o2):
    """Computes similarity between owner names, handling case, space, and reversed words."""
    c1 = clean_text(o1)
    c2 = clean_text(o2)
    if not c1 or not c2:
        return 0.0
    
    sim1 = string_similarity(c1, c2)
    
    # Handle reversed names (e.g. "John Smith" vs "Smith John")
    words1 = c1.split()
    words2 = c2.split()
    if len(words1) == 2 and len(words2) == 2:
        rev_c1 = f"{words1[1]} {words1[0]}"
        sim2 = string_similarity(rev_c1, c2)
        return max(sim1, sim2)
    return sim1

def compute_pair_features(row1, row2):
    """
    Given two dict-like asset records, computes exactly 8 pairwise similarity features.
    Outputs are bounded between 0.0 and 1.0.
    """
    
    # 1. survey_similarity
    s1, s2 = clean_identifier(row1.get('survey_no')), clean_identifier(row2.get('survey_no'))
    survey_sim = string_similarity(s1, s2)
    
    # 2. owner_similarity
    owner_sim = owner_similarity_score(row1.get('owner_name'), row2.get('owner_name'))
    
    # 3. area_similarity
    a1, a2 = safe_float(row1.get('area')), safe_float(row2.get('area'))
    if not pd.isna(a1) and not pd.isna(a2) and (a1 > 0 or a2 > 0):
        diff = abs(a1 - a2)
        max_a = max(a1, a2)
        area_sim = 1.0 - (diff / max_a) # 0 to 1
    else:
        area_sim = 0.0
        
    # 4. location_similarity
    lat1, lon1 = safe_float(row1.get('latitude')), safe_float(row1.get('longitude'))
    lat2, lon2 = safe_float(row2.get('latitude')), safe_float(row2.get('longitude'))
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    if not pd.isna(dist):
        # Exponential decay of distance (e.g., dist=0km -> 1.0, dist=2km -> ~0.36)
        loc_sim = math.exp(-dist / 2.0)
    else:
        loc_sim = 0.0
        
    # 5. land_id_similarity
    id1, id2 = clean_identifier(row1.get('land_id')), clean_identifier(row2.get('land_id'))
    land_id_sim = string_similarity(id1, id2)
    
    # 6. asset_type_match
    t1, t2 = clean_text(row1.get('asset_type')), clean_text(row2.get('asset_type'))
    asset_match = 1.0 if (t1 and t2 and t1 == t2) else 0.0
    
    # 7. description_similarity
    d1, d2 = clean_text(row1.get('description')), clean_text(row2.get('description'))
    desc_sim = string_similarity(d1, d2)
    
    # 8. coordinate_validity
    # 1.0 if both coordinate pairs are valid, otherwise 0.0
    def valid_coords(lat, lon):
        if pd.isna(lat) or pd.isna(lon): return 0.0
        return 1.0 if (-90 <= lat <= 90) and (-180 <= lon <= 180) else 0.0
    
    coord_val = valid_coords(lat1, lon1) * valid_coords(lat2, lon2)

    return {
        'survey_similarity': survey_sim,
        'owner_similarity': owner_sim,
        'area_similarity': area_sim,
        'location_similarity': loc_sim,
        'land_id_similarity': land_id_sim,
        'asset_type_match': asset_match,
        'description_similarity': desc_sim,
        'coordinate_validity': coord_val
    }

def generate_features_dataset(assets_df, pairs_df):
    """Batch generates features for a dataframe of pairs."""
    assets_dict = assets_df.set_index('asset_id').to_dict('index')
    features_list = []
    
    for _, pair in pairs_df.iterrows():
        a1 = pair['asset_id_1']
        a2 = pair['asset_id_2']
        if a1 in assets_dict and a2 in assets_dict:
            feats = compute_pair_features(assets_dict[a1], assets_dict[a2])
            # Include identifiers and labels for tracking and training
            feats['asset_id_1'] = a1
            feats['asset_id_2'] = a2
            feats['duplicate_label'] = pair['duplicate_label']
            features_list.append(feats)
            
    return pd.DataFrame(features_list)

if __name__ == "__main__":
    assets_path = '../data/raw/land_assets.csv'
    pairs_path = '../data/raw/labeled_pairs.csv'
    out_path = '../data/processed/features.csv'
    
    print("Loading raw datasets...")
    assets = pd.read_csv(assets_path)
    pairs = pd.read_csv(pairs_path)
    
    print("Generating similarity features...")
    features_df = generate_features_dataset(assets, pairs)
    
    print("Saving processed features dataset...")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    # Reorder columns for readability: IDs, features, label
    feature_cols = [
        'survey_similarity', 'owner_similarity', 'area_similarity', 'location_similarity', 
        'land_id_similarity', 'asset_type_match', 'description_similarity', 'coordinate_validity'
    ]
    cols = ['asset_id_1', 'asset_id_2'] + feature_cols + ['duplicate_label']
    features_df = features_df[cols]
    
    features_df.to_csv(out_path, index=False)
    
    print("\nFeature Generation Complete.")
    print(f"Total Rows: {len(features_df)}")
    print("\nMissing Values Summary:")
    print(features_df.isna().sum())
    
    print("\nSimilarity Feature Bounds (Min / Max):")
    for c in feature_cols:
        print(f"  {c}: {features_df[c].min():.2f} / {features_df[c].max():.2f}")
