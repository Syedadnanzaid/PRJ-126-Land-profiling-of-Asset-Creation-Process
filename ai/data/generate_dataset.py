import pandas as pd
import numpy as np
import random
import os

np.random.seed(42)
random.seed(42)

def generate_base_assets(n=2000):
    assets = []
    first_names = ["John", "Mary", "Michael", "Sarah", "Raj", "Anita", "David", "Priya", "James", "Elena"]
    last_names = ["Smith", "Johnson", "Patel", "Garcia", "Brown", "Sharma", "Jones", "Miller", "Davis", "Martinez"]
    types = ["Agricultural", "Commercial", "Residential", "Industrial"]
    
    for i in range(n):
        asset_id = f"AST-{10000+i}"
        land_id = f"LND-{10000+i}"
        survey_no = f"SY-{random.randint(100, 999)}/{random.choice(['A', 'B', 'C', '1', '2'])}"
        owner = f"{random.choice(first_names)} {random.choice(last_names)}"
        area = round(random.uniform(0.5, 50.0), 2)
        # Random coordinates in a plausible range
        lat = round(random.uniform(10.0, 30.0), 6)
        lon = round(random.uniform(70.0, 90.0), 6)
        atype = random.choice(types)
        desc = f"Parcel of {area} units located at survey {survey_no}."
        
        assets.append({
            "asset_id": asset_id,
            "land_id": land_id,
            "survey_no": survey_no,
            "owner_name": owner,
            "area": area,
            "latitude": lat,
            "longitude": lon,
            "asset_type": atype,
            "description": desc,
            "base_idx": i # Internal tracker for generating pairs
        })
    return assets

def create_duplicate(base, new_idx):
    dup = base.copy()
    dup["asset_id"] = f"AST-{30000+new_idx}"
    
    # 50% chance to slightly tweak land_id as identifier variation
    if random.random() < 0.5:
        dup["land_id"] = dup["land_id"] + random.choice(["-DUP", "A", "B"])
    
    # Introduce variations
    # 1. Survey no format
    if random.random() < 0.5:
        dup["survey_no"] = dup["survey_no"].replace("SY-", "SY ").replace("/", "-")
    # 2. Owner spelling
    if random.random() < 0.4:
        dup["owner_name"] = dup["owner_name"].lower()
    elif random.random() < 0.3:
        names = dup["owner_name"].split(" ")
        dup["owner_name"] = f"{names[1]}, {names[0]}" if len(names) > 1 else dup["owner_name"]
    # 3. Area diff
    if random.random() < 0.6:
        dup["area"] = round(dup["area"] + random.uniform(-0.05, 0.05), 2)
    # 4. Lat/lon diff
    if random.random() < 0.8:
        dup["latitude"] = round(dup["latitude"] + random.uniform(-0.0001, 0.0001), 6)
        dup["longitude"] = round(dup["longitude"] + random.uniform(-0.0001, 0.0001), 6)
    
    return dup

def main():
    # 1. Generate base unique assets
    base_assets = generate_base_assets(2500)
    all_assets = list(base_assets)
    pairs = []

    # 2. Create duplicates (label = 1)
    dup_count = 0
    for base in base_assets[:800]: # 800 items have at least one duplicate
        dup = create_duplicate(base, dup_count)
        all_assets.append(dup)
        pairs.append({
            "asset_id_1": base["asset_id"],
            "asset_id_2": dup["asset_id"],
            "duplicate_label": 1
        })
        dup_count += 1
        
        # 2nd duplicate for some to create multiple conflicts
        if random.random() < 0.2:
            dup2 = create_duplicate(base, dup_count)
            all_assets.append(dup2)
            pairs.append({
                "asset_id_1": base["asset_id"],
                "asset_id_2": dup2["asset_id"],
                "duplicate_label": 1
            })
            # pair the two duplicates as well
            pairs.append({
                "asset_id_1": dup["asset_id"],
                "asset_id_2": dup2["asset_id"],
                "duplicate_label": 1
            })
            dup_count += 1

    # 3. Create non-duplicates (label = 0)
    
    # Hard negative: Same owner, different land record (coordinates and survey diff)
    for i in range(800, 1100):
        b1 = base_assets[i]
        b2 = base_assets[i+1000]
        b2["owner_name"] = b1["owner_name"]
        pairs.append({
            "asset_id_1": b1["asset_id"],
            "asset_id_2": b2["asset_id"],
            "duplicate_label": 0
        })

    # Hard negative: Nearby coordinates (diff owner, diff land)
    for i in range(1100, 1400):
        b1 = base_assets[i]
        b2 = base_assets[i+1000]
        b2["latitude"] = round(b1["latitude"] + random.uniform(-0.0005, 0.0005), 6)
        b2["longitude"] = round(b1["longitude"] + random.uniform(-0.0005, 0.0005), 6)
        pairs.append({
            "asset_id_1": b1["asset_id"],
            "asset_id_2": b2["asset_id"],
            "duplicate_label": 0
        })
        
    # Hard negative: Same Survey No, but completely different place and owner (data entry error simulation)
    for i in range(1400, 1500):
        b1 = base_assets[i]
        b2 = base_assets[i+1000]
        b2["survey_no"] = b1["survey_no"]
        pairs.append({
            "asset_id_1": b1["asset_id"],
            "asset_id_2": b2["asset_id"],
            "duplicate_label": 0
        })

    # Easy negatives: Random pairs
    for i in range(500):
        b1 = random.choice(base_assets)
        b2 = random.choice(base_assets)
        if b1["asset_id"] != b2["asset_id"]:
            pairs.append({
                "asset_id_1": b1["asset_id"],
                "asset_id_2": b2["asset_id"],
                "duplicate_label": 0
            })

    # Clean up internal tracker
    for a in all_assets:
        if "base_idx" in a:
            del a["base_idx"]

    # Save
    df_assets = pd.DataFrame(all_assets)
    df_pairs = pd.DataFrame(pairs)

    # Drop any accidental exact duplicates
    df_pairs = df_pairs.drop_duplicates(subset=["asset_id_1", "asset_id_2"])

    # Shuffle pairs
    df_pairs = df_pairs.sample(frac=1, random_state=42).reset_index(drop=True)

    # Output stats
    num_assets = len(df_assets)
    num_dups = len(df_pairs[df_pairs['duplicate_label'] == 1])
    num_non_dups = len(df_pairs[df_pairs['duplicate_label'] == 0])
    total_pairs = len(df_pairs)
    
    print(f"Num Assets: {num_assets}")
    print(f"Num Duplicates: {num_dups}")
    print(f"Num Non-Duplicates: {num_non_dups}")
    print(f"Total Pairs: {total_pairs}")
    print(f"Class Distribution: {num_dups/total_pairs*100:.1f}% Duplicates, {num_non_dups/total_pairs*100:.1f}% Non-Duplicates")

    os.makedirs('raw', exist_ok=True)
    df_assets.to_csv('raw/land_assets.csv', index=False)
    df_pairs.to_csv('raw/labeled_pairs.csv', index=False)

if __name__ == "__main__":
    main()
