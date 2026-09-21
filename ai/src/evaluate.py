import pandas as pd
import joblib
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score, average_precision_score

def main():
    print("Loading test set and model...")
    test = pd.read_csv('../data/processed/test.csv')
    model_data = joblib.load('../models/random_forest_duplicate.pkl')
    
    rf = model_data['model']
    thresh = model_data['optimal_threshold']
    feature_cols = model_data['feature_cols']
    
    X_test = test[feature_cols]
    y_test = test['duplicate_label']
    
    print("Running predictions on untouched test set...")
    probs = rf.predict_proba(X_test)[:, 1]
    preds = (probs >= thresh).astype(int)
    
    precision = precision_score(y_test, preds)
    recall = recall_score(y_test, preds)
    f1 = f1_score(y_test, preds)
    cm = confusion_matrix(y_test, preds)
    roc_auc = roc_auc_score(y_test, probs)
    pr_auc = average_precision_score(y_test, probs)
    
    # Feature Importance
    importances = rf.feature_importances_
    feat_imp = sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)
    
    report = f"""# Model Evaluation Report

## Evaluation Metrics (Untouched Test Set)
- **Optimal Probability Threshold:** `{thresh:.2f}` (selected via validation set)
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
        
    report += "\n*Note: The dataset was split using an asset-level group-aware approach to entirely prevent data leakage. Threshold was calibrated on an isolated validation set.*"
    
    with open('../models/evaluation_report.md', 'w') as f:
        f.write(report)
        
    print("\n" + report)
    print("\nSaved evaluation report to ai/models/evaluation_report.md")

if __name__ == "__main__":
    main()
