# Synthetic Data Generation for PRJ-126

This directory contains the synthetic training dataset for the PRJ-126 Land Asset duplicate detection module.

## Files
- `raw/land_assets.csv`: Contains the realistic land record data including `asset_id`, `land_id`, `survey_no`, `owner_name`, `area`, `latitude`, `longitude`, `asset_type`, and `description`.
- `raw/labeled_pairs.csv`: Contains pairs of `asset_id_1` and `asset_id_2` along with a `duplicate_label` (1 = duplicate, 0 = non-duplicate).

## Data Generation Process

Data was synthetically generated using a custom Python script (`generate_dataset.py`).

### Base Records
We first generate base unique records with randomized names, realistic coordinate bounds, survey numbers (e.g., SY-123/A), and land areas.

### Duplicate Pairs (Label = 1)
For a subset of base records, we create duplicates by introducing realistic noise:
- **Identifier Variations:** Sometimes slightly modifying the `land_id`.
- **Survey Number Variations:** Modifying the format (e.g., changing `SY-123/A` to `SY 123-A`).
- **Owner Spelling:** Lowercasing names or reversing first/last names (e.g., "John Smith" to "Smith, John").
- **Area Variations:** Injecting small jitter into the area measurements (+/- 0.05).
- **Coordinate Variations:** Shifting latitude/longitude by tiny degrees to simulate GPS inaccuracies.

### Non-Duplicate Pairs (Label = 0)
To make the model robust and learn meaningful features rather than naive memorization, we specifically constructed **hard negatives**:
1. **Same Owner, Different Land:** Two distinct parcels that share the exact same owner name.
2. **Nearby Parcels:** Two parcels that are geographically very close but have different owners and surveys.
3. **Same Survey, Different Land:** Simulating data entry overlaps where survey numbers match by mistake, but coordinates and owners differ entirely.
4. **Easy Negatives:** Completely random pairings.

## Note
No AI models are trained on this data yet. Features based on similarity between these pairs will be computed downstream in `ai/src`.
