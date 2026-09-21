import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score

def get_group_ids(df):
    """Assigns a connected component group ID to prevent leakage across splits."""
    adj = {}
    for _, row in df.iterrows():
        a, b = row['asset_id_1'], row['asset_id_2']
        if a not in adj: adj[a] = set()
        if b not in adj: adj[b] = set()
        adj[a].add(b)
        adj[b].add(a)
    
    visited = set()
    node_to_group = {}
    group_id = 0
    for node in adj.keys():
        if node not in visited:
            stack = [node]
            while stack:
                curr = stack.pop()
                if curr not in visited:
                    visited.add(curr)
                    node_to_group[curr] = group_id
                    stack.extend(adj[curr] - visited)
            group_id += 1
            
    df['group_id'] = df.apply(lambda r: node_to_group[r['asset_id_1']], axis=1)
    return df

def split_data(df):
    """Splits into Train(60%), Val(20%), Test(20%) while checking class balance."""
    groups = df['group_id'].unique()
    np.random.seed(42) # Ensures reproducibility
    
    max_attempts = 500
    for attempt in range(max_attempts):
        np.random.shuffle(groups)
        n = len(groups)
        train_g = set(groups[:int(0.6*n)])
        val_g = set(groups[int(0.6*n):int(0.8*n)])
        test_g = set(groups[int(0.8*n):])
        
        train = df[df['group_id'].isin(train_g)]
        val = df[df['group_id'].isin(val_g)]
        test = df[df['group_id'].isin(test_g)]
        
        def check_balance(d):
            if len(d) == 0: return False
            p = d['duplicate_label'].mean()
            return 0.15 <= p <= 0.85 # Ensure a decent class balance in each split
            
        if check_balance(train) and check_balance(val) and check_balance(test):
            print(f"Valid and balanced split found on attempt {attempt+1}")
            return train, val, test
            
    raise ValueError("Could not find a balanced group-aware split.")

def main():
    features_cols = [
        'survey_similarity', 'owner_similarity', 'area_similarity', 
        'location_similarity', 'land_id_similarity', 'asset_type_match', 
        'description_similarity', 'coordinate_validity'
    ]
    
    print("Loading features...")
    df = pd.read_csv('../data/processed/features.csv')
    df = get_group_ids(df)
    
    print("Splitting dataset into Train, Val, Test...")
    train, val, test = split_data(df)
    
    print("Train Class Dist:", train['duplicate_label'].value_counts().to_dict())
    print("Val Class Dist:", val['duplicate_label'].value_counts().to_dict())
    print("Test Class Dist:", test['duplicate_label'].value_counts().to_dict())
    
    train.to_csv('../data/processed/train.csv', index=False)
    val.to_csv('../data/processed/val.csv', index=False)
    test.to_csv('../data/processed/test.csv', index=False)
    
    print("Training RandomForestClassifier...")
    rf = RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced", n_jobs=-1)
    rf.fit(train[features_cols], train['duplicate_label'])
    
    print("Tuning decision threshold using validation set...")
    probs = rf.predict_proba(val[features_cols])[:, 1]
    best_thresh, best_f1 = 0.5, 0.0
    for t in np.arange(0.1, 0.9, 0.02):
        preds = (probs >= t).astype(int)
        f1 = f1_score(val['duplicate_label'], preds)
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = t
            
    print(f"Optimal Threshold selected: {best_thresh:.2f} (Val F1: {best_f1:.4f})")
    
    model_data = {
        'model': rf,
        'optimal_threshold': best_thresh,
        'feature_cols': features_cols
    }
    
    os.makedirs('../models', exist_ok=True)
    joblib.dump(model_data, '../models/random_forest_duplicate.pkl')
    print("Model and optimal threshold saved to ai/models/random_forest_duplicate.pkl")

if __name__ == "__main__":
    main()
