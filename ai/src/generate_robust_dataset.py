import pandas as pd
import numpy as np
import random
import os

np.random.seed(42)
random.seed(42)

def generate_base_assets(n=8000):
    assets = []
    first_names = ["John", "Mary", "Michael", "Sarah", "Raj", "Anita", "David", "Priya", "James", "Elena", "Ahmed", "Fatima", "Luis", "Carmen", "William", "Elizabeth"]
    last_names = ["Smith", "Johnson", "Patel", "Garcia", "Brown", "Sharma", "Jones", "Miller", "Davis", "Martinez", "Ali", "Khan", "Gomez", "Rodriguez", "Williams", "Taylor"]
    types = ["Agricultural", "Commercial", "Residential", "Industrial", "Mixed Use"]
    descs = [
        "Parcel of {area} units located at survey {survey_no}.",
        "Land holding designated as {atype}, survey number {survey_no}.",
        "Property owned by {owner}, {area} sq meters.",
        "Vacant {atype} lot in district 4.",
        "A beautiful {atype} land parcel."
    ]
    
    for i in range(n):
        asset_id = f"AST-R{10000+i}"
        land_id = f"LND-R{10000+i}"
        survey_no = f"SY-{random.randint(100, 9999)}/{random.choice(['A', 'B', 'C', '1', '2', 'X', 'Y'])}"
        owner = f"{random.choice(first_names)} {random.choice(last_names)}"
        area = round(random.uniform(0.1, 100.0), 2)
        lat = round(random.uniform(10.0, 30.0), 6)
        lon = round(random.uniform(70.0, 90.0), 6)
        atype = random.choice(types)
        desc = random.choice(descs).format(area=area, survey_no=survey_no, atype=atype, owner=owner)
        
        assets.append({
            "asset_id": asset_id,
            "land_id": land_id,
            "survey_no": survey_no,
            "owner_name": owner,
            "area": area,
            "latitude": lat,
            "longitude": lon,
            "asset_type": atype,
            "description": desc
        })
    return assets

def create_duplicate(base, new_idx):
    dup = base.copy()
    dup["asset_id"] = f"AST-RD{30000+new_idx}"
    
    if random.random() < 0.5:
        dup["land_id"] = dup["land_id"] + random.choice(["-DUP", "A", "B", "-NEW"])
        
    if random.random() < 0.6:
        dup["survey_no"] = dup["survey_no"].replace("SY-", random.choice(["SY ", "S-", ""])).replace("/", random.choice(["-", " ", ""]))
        
    if random.random() < 0.7:
        choice = random.random()
        names = dup["owner_name"].split(" ")
        if choice < 0.2:
            dup["owner_name"] = dup["owner_name"].lower()
        elif choice < 0.4 and len(names) == 2:
            dup["owner_name"] = f"{names[1]}, {names[0]}"
        elif choice < 0.6 and len(names) == 2:
            dup["owner_name"] = f"{names[0][0]}. {names[1]}"
        elif choice < 0.8:
            dup["owner_name"] = dup["owner_name"] + " " + random.choice(["JR", "SR", "MD"])
        else:
            words = list(dup["owner_name"])
            if words:
                idx = random.randint(0, len(words)-1)
                words[idx] = 'x'
                dup["owner_name"] = "".join(words)
            
    if random.random() < 0.8:
        dup["area"] = round(dup["area"] * random.uniform(0.85, 1.15), 2)
        
    if random.random() < 0.8:
        dup["latitude"] = round(dup["latitude"] + random.uniform(-0.005, 0.005), 6)
        dup["longitude"] = round(dup["longitude"] + random.uniform(-0.005, 0.005), 6)
        
    # Inject missing fields to challenge the model
    if random.random() < 0.3:
        field_to_drop = random.choice(["description", "asset_type", "area", "owner_name", "latitude", "longitude"])
        dup[field_to_drop] = np.nan
        
    if random.random() < 0.4:
        dup["description"] = "Same property, different description format."
        
    return dup

def main():
    base_assets = generate_base_assets(8000)
    all_assets = list(base_assets)
    pairs = []

    # Duplicates
    dup_count = 0
    for base in base_assets[:3000]:
        dup = create_duplicate(base, dup_count)
        all_assets.append(dup)
        pairs.append({"asset_id_1": base["asset_id"], "asset_id_2": dup["asset_id"], "duplicate_label": 1})
        dup_count += 1
        
        if random.random() < 0.3:
            dup2 = create_duplicate(base, dup_count)
            all_assets.append(dup2)
            pairs.append({"asset_id_1": base["asset_id"], "asset_id_2": dup2["asset_id"], "duplicate_label": 1})
            pairs.append({"asset_id_1": dup["asset_id"], "asset_id_2": dup2["asset_id"], "duplicate_label": 1})
            dup_count += 1

    # Hard negatives
    for i in range(3000, 4500):
        b1 = base_assets[i]
        b2 = base_assets[i+1500]
        b2["owner_name"] = b1["owner_name"]
        pairs.append({"asset_id_1": b1["asset_id"], "asset_id_2": b2["asset_id"], "duplicate_label": 0})

    for i in range(4500, 5500):
        b1 = base_assets[i]
        b2 = base_assets[i+1500]
        b2["latitude"] = round(b1["latitude"] + random.uniform(-0.0001, 0.0001), 6)
        b2["longitude"] = round(b1["longitude"] + random.uniform(-0.0001, 0.0001), 6)
        pairs.append({"asset_id_1": b1["asset_id"], "asset_id_2": b2["asset_id"], "duplicate_label": 0})
        
    for i in range(5500, 6000):
        b1 = base_assets[i]
        b2 = base_assets[i+1500]
        b2["survey_no"] = b1["survey_no"]
        pairs.append({"asset_id_1": b1["asset_id"], "asset_id_2": b2["asset_id"], "duplicate_label": 0})
        
    for i in range(6000, 6500):
        b1 = base_assets[i]
        b2 = base_assets[i+1000]
        name1 = b1["owner_name"].split(" ")
        name2 = b2["owner_name"].split(" ")
        if len(name1) == 2 and len(name2) == 2:
            b2["owner_name"] = f"{name2[0]} {name1[1]}"
        pairs.append({"asset_id_1": b1["asset_id"], "asset_id_2": b2["asset_id"], "duplicate_label": 0})

    # Random negatives
    for i in range(2500):
        b1 = random.choice(base_assets)
        b2 = random.choice(base_assets)
        if b1["asset_id"] != b2["asset_id"]:
            pairs.append({"asset_id_1": b1["asset_id"], "asset_id_2": b2["asset_id"], "duplicate_label": 0})

    df_assets = pd.DataFrame(all_assets)
    df_pairs = pd.DataFrame(pairs)
    df_pairs = df_pairs.drop_duplicates(subset=["asset_id_1", "asset_id_2"])
    df_pairs = df_pairs.sample(frac=1, random_state=42).reset_index(drop=True)

    os.makedirs('../data/robustness/raw', exist_ok=True)
    df_assets.to_csv('../data/robustness/raw/land_assets.csv', index=False)
    df_pairs.to_csv('../data/robustness/raw/labeled_pairs.csv', index=False)
    print("Robustness raw data generation complete.")

if __name__ == "__main__":
    main()
