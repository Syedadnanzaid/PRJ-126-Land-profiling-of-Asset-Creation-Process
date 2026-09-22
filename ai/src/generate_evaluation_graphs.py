import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import (
    confusion_matrix, roc_curve, auc, precision_recall_curve,
    average_precision_score, f1_score, precision_score, recall_score, roc_auc_score
)

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, 'models', 'random_forest_duplicate.pkl')
    test_data_path = os.path.join(base_dir, 'data', 'robustness', 'processed', 'test.csv')
    val_data_path = os.path.join(base_dir, 'data', 'robustness', 'processed', 'val.csv')
    graphs_dir = os.path.join(base_dir, 'models', 'graphs')
    
    os.makedirs(graphs_dir, exist_ok=True)
    
    print(f"Loading model from {model_path}...")
    model_data = joblib.load(model_path)
    
    # Extract model and metadata
    rf = model_data['model']
    # The prompt explicitly states the threshold is 0.22, we check if it matches
    threshold = model_data.get('optimal_threshold', 0.22)
    feature_cols = model_data.get('feature_cols', [
        'survey_similarity', 'owner_similarity', 'area_similarity', 
        'location_similarity', 'land_id_similarity', 'asset_type_match', 
        'description_similarity', 'coordinate_validity'
    ])
    
    print(f"Using threshold: {threshold}")
    
    print("Loading test and val datasets...")
    test_df = pd.read_csv(test_data_path)
    val_df = pd.read_csv(val_data_path)
    
    X_test = test_df[feature_cols]
    y_test = test_df['duplicate_label']
    
    X_val = val_df[feature_cols]
    y_val = val_df['duplicate_label']
    
    print("Generating predictions on test set...")
    probs_test = rf.predict_proba(X_test)[:, 1]
    preds_test = (probs_test >= threshold).astype(int)
    
    # Calculate Metrics
    precision = precision_score(y_test, preds_test)
    recall = recall_score(y_test, preds_test)
    f1 = f1_score(y_test, preds_test)
    roc_auc = roc_auc_score(y_test, probs_test)
    pr_auc = average_precision_score(y_test, probs_test)
    
    print("--- Test Set Metrics ---")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print(f"PR-AUC:    {pr_auc:.4f}")
    
    # 1. Confusion Matrix
    print("Generating Confusion Matrix...")
    cm = confusion_matrix(y_test, preds_test)
    fig, ax = plt.subplots(figsize=(6, 5))
    cax = ax.matshow(cm, cmap=plt.cm.Blues)
    plt.colorbar(cax)
    
    for (i, j), z in np.ndenumerate(cm):
        ax.text(j, i, f'{z}', ha='center', va='center', fontsize=14, 
                color='white' if z > cm.max()/2 else 'black')
        
    plt.title('Confusion Matrix', pad=20)
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.xticks([0, 1], ['Non-Duplicate (0)', 'Duplicate (1)'])
    plt.yticks([0, 1], ['Non-Duplicate (0)', 'Duplicate (1)'])
    plt.tight_layout()
    plt.savefig(os.path.join(graphs_dir, 'confusion_matrix.png'), dpi=300)
    plt.close()
    
    # 2. ROC Curve
    print("Generating ROC Curve...")
    fpr, tpr, _ = roc_curve(y_test, probs_test)
    plt.figure(figsize=(7, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.4f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic (ROC) Curve')
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(graphs_dir, 'roc_curve.png'), dpi=300)
    plt.close()
    
    # 3. Precision-Recall Curve
    print("Generating Precision-Recall Curve...")
    precisions, recalls, _ = precision_recall_curve(y_test, probs_test)
    plt.figure(figsize=(7, 6))
    plt.plot(recalls, precisions, color='blue', lw=2, label=f'PR curve (AUC = {pr_auc:.4f})')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve')
    plt.legend(loc="lower left")
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(graphs_dir, 'precision_recall_curve.png'), dpi=300)
    plt.close()
    
    # 4. Feature Importance
    print("Generating Feature Importance...")
    importances = rf.feature_importances_
    indices = np.argsort(importances)
    plt.figure(figsize=(8, 6))
    plt.title('Random Forest Feature Importances')
    plt.barh(range(len(indices)), importances[indices], color='green', align='center')
    plt.yticks(range(len(indices)), [feature_cols[i] for i in indices])
    plt.xlabel('Relative Importance')
    plt.grid(axis='x', alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(graphs_dir, 'feature_importance.png'), dpi=300)
    plt.close()
    
    # 5. Test Class Distribution
    print("Generating Test Class Distribution...")
    counts = y_test.value_counts().sort_index()
    percentages = 100 * counts / len(y_test)
    labels = ['Non-Duplicate (0)', 'Duplicate (1)']
    plt.figure(figsize=(6, 5))
    bars = plt.bar(labels, counts.values, color=['skyblue', 'salmon'])
    plt.title('Test Set Class Distribution')
    plt.ylabel('Count')
    for bar, pct in zip(bars, percentages.values):
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.5,
                 f'{int(height)}\n({pct:.1f}%)', ha='center', va='bottom')
    # Make y-axis upper limit a bit higher to fit text
    plt.ylim(0, max(counts.values) * 1.15)
    plt.tight_layout()
    plt.savefig(os.path.join(graphs_dir, 'test_class_distribution.png'), dpi=300)
    plt.close()
    
    # 6. Threshold Analysis (on VALIDATION SET)
    print("Generating Threshold Analysis on Validation Set...")
    probs_val = rf.predict_proba(X_val)[:, 1]
    thresholds = np.linspace(0.0, 1.0, 100)
    precisions_val = []
    recalls_val = []
    f1s_val = []
    
    for t in thresholds:
        preds_v = (probs_val >= t).astype(int)
        # Using zero_division=0 to handle extreme thresholds where no positive predictions exist
        p = precision_score(y_val, preds_v, zero_division=0)
        r = recall_score(y_val, preds_v, zero_division=0)
        f = f1_score(y_val, preds_v, zero_division=0)
        precisions_val.append(p)
        recalls_val.append(r)
        f1s_val.append(f)
        
    plt.figure(figsize=(8, 6))
    plt.plot(thresholds, precisions_val, label='Precision', color='blue', lw=2)
    plt.plot(thresholds, recalls_val, label='Recall', color='red', lw=2)
    plt.plot(thresholds, f1s_val, label='F1-Score', color='green', lw=2)
    
    plt.axvline(x=threshold, color='black', linestyle='--', label=f'Selected Threshold ({threshold})')
    
    plt.title('Validation Set Metrics vs. Threshold')
    plt.xlabel('Probability Threshold')
    plt.ylabel('Score')
    plt.legend(loc='lower center')
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(graphs_dir, 'threshold_analysis.png'), dpi=300)
    plt.close()
    
    # 7. Metrics Summary
    print("Generating Metrics Summary...")
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.axis('tight')
    ax.axis('off')
    
    metrics_data = [
        ["Metric", "Value"],
        ["Precision", f"{precision:.4f}"],
        ["Recall", f"{recall:.4f}"],
        ["F1-Score", f"{f1:.4f}"],
        ["ROC-AUC", f"{roc_auc:.4f}"],
        ["PR-AUC", f"{pr_auc:.4f}"]
    ]
    
    table = ax.table(cellText=metrics_data, loc='center', cellLoc='center', colWidths=[0.4, 0.4])
    table.auto_set_font_size(False)
    table.set_fontsize(14)
    table.scale(1.2, 2)
    
    # Make header bold (if possible) or just color it
    for (row, col), cell in table.get_celld().items():
        if row == 0:
            cell.set_text_props(weight='bold')
            cell.set_facecolor('#d3d3d3')
            
    plt.title('Test Set Evaluation Metrics', pad=20, weight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(graphs_dir, 'metrics_summary.png'), dpi=300)
    plt.close()

    print("All graphs successfully generated in:", graphs_dir)

if __name__ == "__main__":
    main()
