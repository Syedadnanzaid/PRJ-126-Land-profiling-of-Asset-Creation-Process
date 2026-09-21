import os
import pandas as pd
import numpy as np
import joblib
from features import generate_features_dataset
from train import get_group_ids, split_data
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score, precision_score, recall_score, confusion_matrix, roc_auc_score, average_precision_score

def main():
    print("Loading robust datasets...")
    assets = pd.read_csv('../data/robustness/raw/land_assets.csv')
    pairs = pd.read_csv('../data/robustness/raw/labeled_pairs.csv')
    
    print("Generating features...")
    features_df = generate_features_dataset(assets, pairs)
    os.makedirs('../data/robustness/processed', exist_ok=True)
    features_df.to_csv('../data/robustness/processed/features.csv', index=False)
    
    print("Splitting dataset using connected components...")
    df = get_group_ids(features_df)
    train, val, test = split_data(df)
    
    train.to_csv('../data/robustness/processed/train.csv', index=False)
    val.to_csv('../data/robustness/processed/val.csv', index=False)
    test.to_csv('../data/robustness/processed/test.csv', index=False)
    
    features_cols = [
        'survey_similarity', 'owner_similarity', 'area_similarity', 
        'location_similarity', 'land_id_similarity', 'asset_type_match', 
        'description_similarity', 'coordinate_validity'
    ]
    
    print("Training robust Random Forest...")
    rf = RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced", n_jobs=-1)
    rf.fit(train[features_cols], train['duplicate_label'])
    
    print("Tuning threshold on validation set...")
    probs_val = rf.predict_proba(val[features_cols])[:, 1]
    best_thresh, best_f1 = 0.5, 0.0
    for t in np.arange(0.1, 0.9, 0.02):
        preds = (probs_val >= t).astype(int)
        f1 = f1_score(val['duplicate_label'], preds)
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = t
            
    print(f"Optimal Threshold: {best_thresh:.2f}")
    
    print("Evaluating on test set...")
    probs_test = rf.predict_proba(test[features_cols])[:, 1]
    y_test = test['duplicate_label']
    preds_test = (probs_test >= best_thresh).astype(int)
    
    precision = precision_score(y_test, preds_test)
    recall = recall_score(y_test, preds_test)
    f1 = f1_score(y_test, preds_test)
    cm = confusion_matrix(y_test, preds_test)
    roc_auc = roc_auc_score(y_test, probs_test)
    pr_auc = average_precision_score(y_test, probs_test)
    
    importances = rf.feature_importances_
    feat_imp = sorted(zip(features_cols, importances), key=lambda x: x[1], reverse=True)
    
    report = f"""# Robustness Model Evaluation Report

## Dataset Summary
- **Total Records:** {len(assets)}
- **Total Pairs:** {len(pairs)}
- **Train Pairs:** {len(train)}
- **Val Pairs:** {len(val)}
- **Test Pairs:** {len(test)}

## Class Distribution
- **Train:** {train['duplicate_label'].value_counts().to_dict()}
- **Val:** {val['duplicate_label'].value_counts().to_dict()}
- **Test:** {test['duplicate_label'].value_counts().to_dict()}

## Evaluation Metrics (Untouched Test Set)
- **Optimal Probability Threshold:** `{best_thresh:.2f}` (selected via validation set)
- **Precision:** `{precision:.4f}`
- **Recall:** `{recall:.4f}`
- **F1-Score:** `{f1:.4f}`
- **ROC-AUC:** `{roc_auc:.4f}`
- **PR-AUC:** `{pr_auc:.4f}`

## Confusion Matrix
| | Predicted Negative (0) | Predicted Positive (1) |
|---|---|---|
| **Actual Negative (0)** | {cm[0,0]} | {cm[0,1]} |
| **Actual Positive (1)** | {cm[1,0]} | {cm[1,1]} |

## Feature Importances
"""
    for name, imp in feat_imp:
        report += f"- **{name}**: `{imp:.4f}`\n"
        
    with open('../models/robustness_evaluation_report.md', 'w') as f:
        f.write(report)
        
    model_data = {
        'model': rf,
        'optimal_threshold': best_thresh,
        'feature_cols': features_cols
    }
    joblib.dump(model_data, '../models/random_forest_duplicate_robust.pkl')
    
    print("\n--- Evaluation Complete ---")
    print(report)

if __name__ == "__main__":
    main()
