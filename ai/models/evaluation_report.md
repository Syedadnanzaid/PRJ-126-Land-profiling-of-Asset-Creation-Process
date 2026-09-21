# FINAL Model Evaluation Report (Robustness Pipeline)

## Dataset Summary
- **Total Records:** 11874
- **Total Pairs:** 10748
- **Train Pairs:** 2574
- **Val Pairs:** 770
- **Test Pairs:** 7404

## Class Distribution
- **Train:** {1: 1996, 0: 578}
- **Val:** {1: 622, 0: 148}
- **Test:** {0: 5274, 1: 2130}

## Evaluation Metrics (Untouched Test Set)
- **Optimal Probability Threshold:** `0.22` (selected via validation set)
- **Precision:** `0.9669`
- **Recall:** `1.0000`
- **F1-Score:** `0.9832`
- **ROC-AUC:** `1.0000`
- **PR-AUC:** `1.0000`

## Confusion Matrix
| | Predicted Negative (0) | Predicted Positive (1) |
|---|---|---|
| **Actual Negative (0)** | 5201 | 73 |
| **Actual Positive (1)** | 0 | 2130 |

## Feature Importances
- **survey_similarity**: `0.3301`
- **area_similarity**: `0.1907`
- **land_id_similarity**: `0.1882`
- **asset_type_match**: `0.1116`
- **location_similarity**: `0.0748`
- **owner_similarity**: `0.0608`
- **description_similarity**: `0.0283`
- **coordinate_validity**: `0.0156`
