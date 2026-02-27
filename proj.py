<<<<<<< HEAD
=======
from flask import Flask, json, request, jsonify, send_file,Response
from flask_cors import CORS
import pandas as pd
import numpy as np
import io
import os
import math
from datetime import datetime
from pymongo import MongoClient
import uuid
import re
import base64
from bson import ObjectId
from pdf_export import generate_sample_charts
import plotly.graph_objects as go
import plotly.express as px
import plotly.io as pio
from plotly.subplots import make_subplots
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
import base64
from io import BytesIO
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)
client = MongoClient("mongodb://localhost:27017/")
db = client['heavy_metal_db']
samples_collection = db['samples']

# ========== TOKEN CALCULATION FUNCTION ==========
def calculate_tokens(rows):
    """Calculate tokens required based on number of rows in dataset
    Formula:
    - If rows <= 50: 0 tokens (free tier)
    - Otherwise: k = ceil((rows - 50) / 5), tokens = ceil(2.5 * k)
    """
    if rows <= 50:
        return 0
    k = math.ceil((rows - 50) / 5)
    tokens = math.ceil(2.5 * k)
    return tokens

# ========== TOKEN SYSTEM ENDPOINTS ==========

@app.route("/token/check-status", methods=["POST"])
def check_token_status():
    """Check if user has enough tokens for an operation"""
    try:
        data = request.json
        user_id = data.get("user_id", "anonymous")
        tokens_needed = data.get("tokens_needed", 0)
        
        # Get user tokens (for demo, return mock data)
        user_tokens = db.users.find_one({"_id": user_id}) or {"tokens": 0}
        
        current_tokens = user_tokens.get("tokens", 0)
        has_sufficient_tokens = current_tokens >= tokens_needed
        
        return jsonify({
            "user_id": user_id,
            "current_tokens": current_tokens,
            "tokens_needed": tokens_needed,
            "sufficient_tokens": has_sufficient_tokens,
            "tokens_short": max(0, tokens_needed - current_tokens)
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/token/add", methods=["POST"])
def add_tokens():
    """Add tokens to a user account (for demo/testing)"""
    try:
        data = request.json
        user_id = data.get("user_id", "anonymous")
        tokens_to_add = data.get("tokens", 0)
        
        # Update user tokens in MongoDB
        result = db.users.update_one(
            {"_id": user_id},
            {"$inc": {"tokens": tokens_to_add}, "$set": {"last_updated": datetime.utcnow()}},
            upsert=True
        )
        
        user = db.users.find_one({"_id": user_id})
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "tokens_added": tokens_to_add,
            "new_balance": user.get("tokens", 0),
            "message": f"Added {tokens_to_add} tokens"
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/token/deduct", methods=["POST"])
def deduct_tokens():
    """Deduct tokens from a user account"""
    try:
        data = request.json
        user_id = data.get("user_id", "anonymous")
        tokens_to_deduct = data.get("tokens", 0)
        
        user = db.users.find_one({"_id": user_id})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        current_tokens = user.get("tokens", 0)
        if current_tokens < tokens_to_deduct:
            return jsonify({
                "error": "Insufficient tokens",
                "current_tokens": current_tokens,
                "tokens_needed": tokens_to_deduct
            }), 400
        
        result = db.users.update_one(
            {"_id": user_id},
            {"$inc": {"tokens": -tokens_to_deduct}, "$set": {"last_updated": datetime.utcnow()}}
        )
        
        updated_user = db.users.find_one({"_id": user_id})
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "tokens_deducted": tokens_to_deduct,
            "new_balance": updated_user.get("tokens", 0)
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/token/sync", methods=["POST"])
def sync_tokens():
    """Sync tokens from frontend localStorage to MongoDB"""
    try:
        data = request.json
        user_id = data.get("user_id", "anonymous")
        tokens = data.get("tokens", 0)
        
        # Update or create user with token balance
        result = db.users.update_one(
            {"_id": user_id},
            {"$set": {"tokens": tokens, "last_updated": datetime.utcnow()}},
            upsert=True
        )
        
        user = db.users.find_one({"_id": user_id})
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "synced_tokens": tokens,
            "balance": user.get("tokens", 0)
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/token/get-balance", methods=["GET"])
def get_token_balance():
    """Get current token balance for a user"""
    try:
        user_id = request.args.get("user_id", "anonymous")
        
        user = db.users.find_one({"_id": user_id})
        if user:
            return jsonify({
                "user_id": user_id,
                "balance": user.get("tokens", 0),
                "email": user.get("email", "")
            })
        else:
            return jsonify({
                "user_id": user_id,
                "balance": 0,
                "email": ""
            })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ========== TOKEN PRICING INFO ==========

@app.route("/token/pricing", methods=["GET"])
def get_pricing_info():
    """Get pricing information for tokens"""
    pricing_plans = [
        {
            "name": "Starter",
            "tokens": 50,
            "price": 499,
            "currency": "INR",
            "cost_per_token": 9.98,
            "description": "Good for small datasets"
        },
        {
            "name": "Research",
            "tokens": 150,
            "price": 1299,
            "currency": "INR",
            "cost_per_token": 8.66,
            "highlighted": True,
            "description": "Most popular - Best value"
        },
        {
            "name": "Institutional",
            "tokens": 500,
            "price": 3999,
            "currency": "INR",
            "cost_per_token": 7.99,
            "description": "For large-scale projects"
        }
    ]
    
    # Token requirement examples - using actual formula
    token_usage_examples = {
        "small_dataset": {
            "rows": 50,
            "tokens": calculate_tokens(50),
            "description": "≤50 rows (Free tier)"
        },
        "medium_dataset": {
            "rows": 100,
            "tokens": calculate_tokens(100),
            "description": "100 rows | k=10, tokens=⌈2.5×10⌉=25"
        },
        "large_dataset": {
            "rows": 200,
            "tokens": calculate_tokens(200),
            "description": "200 rows | k=30, tokens=⌈2.5×30⌉=75"
        },
        "very_large_dataset": {
            "rows": 500,
            "tokens": calculate_tokens(500),
            "description": "500 rows | k=90, tokens=⌈2.5×90⌉=225"
        },
        "enterprise_dataset": {
            "rows": 1000,
            "tokens": calculate_tokens(1000),
            "description": "1000 rows | k=190, tokens=⌈2.5×190⌉=475"
        }
    }
    
    return jsonify({
        "plans": pricing_plans,
        "token_formula": {
            "description": "Token cost based on dataset size",
            "formula": "if rows ≤ 50: tokens = 0 (free), else: k = ⌈(rows - 50) / 5⌉, tokens = ⌈2.5 × k⌉",
            "free_tier": "Datasets with ≤50 rows process for free"
        },
        "usage_examples": token_usage_examples,
        "free_tier": {
            "max_rows": 50,
            "features": ["Full HMPI analysis", "Export to CSV/PDF", "Visualizations", "Complete metal concentration data"]
        }
    })

METAL_KEYWORDS = {
    'Mercury': ['hg', 'mercury', 'hg_conc', 'mercury_conc', 'merc'],
    'Lead': ['pb', 'lead', 'pb_conc', 'lead_conc'],
    'Cadmium': ['cd', 'cadmium', 'cd_conc'],
    'Arsenic': ['as', 'arsenic', 'as_conc'],
    'Chromium': ['cr', 'chromium', 'cr_conc'],
    'Nickel': ['ni', 'nickel', 'ni_conc'],
    'Copper': ['cu', 'copper', 'cu_conc'],
    'Zinc': ['zn', 'zinc', 'zn_conc'],
    'Iron': ['fe', 'iron', 'fe_conc'],
    'Manganese': ['mn', 'manganese', 'mn_conc']
    }

def allowed_file(filename):
    return filename.lower().endswith(('.csv','.xls','.xlsx'))

def detect_metal_columns(df):
    metal_cols = {}
    for metal, keywords in METAL_KEYWORDS.items():
        found_cols = []
        for col in df.columns:
            col_clean = re.sub(r'[^a-z0-9]', '', col.lower())
            if any(re.sub(r'[^a-z0-9]', '', kw.lower()) in col_clean for kw in keywords):
                found_cols.append(col)
        if found_cols:
            metal_cols[metal] = found_cols
    return metal_cols

def merge_metal_columns(df, metal_cols):
    merged_df = df.copy()
    merged_cols = {}
    for metal, cols in metal_cols.items():
        if not cols:
            continue
        
        if len(cols) > 1:
            merged_df[metal] = merged_df[cols].sum(axis=1)
        else:
            merged_df[metal] = merged_df[cols[0]]
        merged_cols[metal] = metal 
    return merged_df, merged_cols


def validate_geo_columns(df):
    geo_cols = {}
    for col in ['Location', 'Latitude', 'Longitude']:
        matches = [c for c in df.columns if col.lower() in c.lower()]
        geo_cols[col] = matches[0] if matches else None
    return geo_cols

def handle_missing_values(df, metal_cols, strategy='half', detection_limits=None):
    df_clean = df.copy()
    for metal in metal_cols:
        if metal not in df_clean.columns:
            continue
        if strategy=='half':
            fill_val = 0.5*df_clean[metal].min() if detection_limits is None else 0.5*detection_limits.get(metal,0)
            df_clean[metal] = df_clean[metal].fillna(fill_val)

        elif strategy=='zero':
            df_clean[metal].fillna(0, inplace=True)
        elif strategy=='mean':
            df_clean[metal].fillna(df_clean[metal].mean(), inplace=True)
        elif strategy=='median':
            df_clean[metal].fillna(df_clean[metal].median(), inplace=True)
        elif strategy=='none':
            df_clean[metal] = df_clean[metal].astype(float)
    return df_clean

STANDARD_LIMITS = {
    "Mercury": 0.001,
    "Lead": 0.01,
    "Cadmium": 0.003,
    "Arsenic": 0.01,
    "Chromium": 0.05,
    "Nickel": 0.02,
    "Copper": 2.0,
    "Zinc": 3.0,
    "Iron": 0.3,
    "Manganese": 0.1
}
def compute_hmpi_vectorized(df, metal_cols):
    """
    Compute HMPI for a dataframe with metal concentrations.
    Uranium is included in HMPI calculation only if present in DataFrame.
    """
    df_hmpi = df.copy()

    
    valid_metals = {metal: col for metal, col in metal_cols.items() if metal in STANDARD_LIMITS and col in df_hmpi.columns}

    if not valid_metals:
        df_hmpi["HMPI"] = np.nan
        return df_hmpi

    Wi_total = sum(1 / STANDARD_LIMITS[metal] for metal in valid_metals)

    for metal, col in valid_metals.items():
        Si = STANDARD_LIMITS[metal]
        Ci = df_hmpi[col].copy()

        # Convert μg/L → mg/L if Ci is much higher than standard (heuristic)
        if (Ci > 100 * Si).any():
            Ci = Ci / 1000

        Qi = (Ci / Si) * 100
        Wi = (1 / Si) / Wi_total

        df_hmpi[f"{metal}_Qi"] = Qi
        df_hmpi[f"{metal}_Wi"] = Wi
        df_hmpi[f"{metal}_SIi"] = Qi * Wi

    # HMPI = sum of weighted indices (metals detected in dataset)
    si_columns = [f"{metal}_SIi" for metal in valid_metals]
    df_hmpi["HMPI"] = df_hmpi[si_columns].sum(axis=1)
    df_hmpi = df_hmpi.round(4)
    return df_hmpi

def load_file(file):
    """Reads CSV or Excel into pandas DataFrame"""
    if file.filename.lower().endswith('.csv'):
        return pd.read_csv(file)
    elif file.filename.lower().endswith(('.xls', '.xlsx')):
        return pd.read_excel(file)
    else:
        raise ValueError("Unsupported file format")

def preprocess_dataframe(df):
    metal_cols = detect_metal_columns(df)      
    df_merged, merged_cols = merge_metal_columns(df, metal_cols)  
    
    if 'Uranium' in merged_cols and 'Uranium' not in df_merged.columns:
        merged_cols.pop('Uranium')
    
    df_clean = handle_missing_values(df_merged, merged_cols, strategy="half")  
    geo_cols = validate_geo_columns(df_clean)  
    return df_clean, merged_cols



def prepare_geojson(df, geo_cols):
    if geo_cols.get('Latitude') and geo_cols.get('Longitude'):
        df_geo = df.copy()
        df_geo['geometry'] = df_geo.apply(
            lambda row: {"type": "Point", "coordinates": [row[geo_cols['Longitude']], row[geo_cols['Latitude']]]}
            if pd.notna(row[geo_cols['Longitude']]) and pd.notna(row[geo_cols['Latitude']])
            else None, axis=1)
        return df_geo
    return None


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]

    try:
        
        df = load_file(file)

        
        df_clean, merged_cols = preprocess_dataframe(df)
        df_hmpi = compute_hmpi_vectorized(df_clean, merged_cols)

       
        valid_metals_for_geo = [m for m in merged_cols if m in df_hmpi.columns]

        # Build GeoJSON features
        sample_counter = 1  
        features = []
        for _, row in df_hmpi.iterrows():
            metal_conc = {m: row[m] for m in valid_metals_for_geo if pd.notna(row[m])}
            latlon_flag = pd.notna(row.get("Latitude")) and pd.notna(row.get("Longitude"))

            # If no Sample_ID present in row, assign sequential ID like S1, S2...
            sample_id = row.get("Sample_ID")
            if pd.isna(sample_id) or sample_id == "":
                sample_id = f"S{sample_counter}"
                sample_counter += 1

            features.append({
                "Sample_ID": sample_id,
                "no_of_metals": len(metal_conc),
                "all_metal_conc": metal_conc,
                "geometry": {
                    "type": "Point",
                    "coordinates": [row.get("Longitude"), row.get("Latitude")]
                },
                "latitudeandlongitudepresent": latlon_flag,
                "HMPI": row.get("HMPI", None)
            })
        # Insert into uploads collection
        upload_doc = {
            "file_name": file.filename,
            "created_at": datetime.utcnow(),
            "GeoJSON": features
        }
        db.uploads.insert_one(upload_doc)

        return jsonify({"msg": "Upload saved successfully", "file_name": file.filename, "GeoJSON": features}), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/history/<user_id>", methods=["GET"])
def user_history(user_id):
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id)}},
        {"$lookup": {
            "from": "users",              
            "localField": "user_id",      # field in uploads
            "foreignField": "_id",        # field in users
            "as": "user_info"
        }},
        {"$unwind": "$user_info"}  # flatten array so user_info is a dict
    ]

    uploads = list(db.uploads.aggregate(pipeline))
    # convert ObjectId to string for JSON
    for u in uploads:
        u["_id"] = str(u["_id"])
        u["user_id"] = str(u["user_id"])
        u["user_info"]["_id"] = str(u["user_info"]["_id"])

    return jsonify(uploads)
def generate_sample_charts(df, metal_columns):
    """
    Generate per-sample charts (bar + pie + radar) for each row in the dataframe.
    Returns dict: { Sample_ID: { "bar": json_str, "pie": json_str, "radar": json_str } }
    """
    sample_charts = {}

    for index, row in df.iterrows():
        sample_id = row.get("Sample_ID", f"Sample_{index+1}")
        charts_for_sample = {}

        # --- Bar Chart: metal concentrations ---
        bar_data = [
            {"Metal": metal, "Concentration": row[col]}
            for metal, col in metal_columns.items()
            if col in df.columns and pd.notna(row[col])
        ]
        bar_df = pd.DataFrame(bar_data)

        if not bar_df.empty:
            bar_fig = px.bar(
                bar_df,
                x="Metal",
                y="Concentration",
                title=f"Metal Concentrations for {sample_id}",
                labels={"Concentration": "mg/L"},
            )
            bar_fig.update_layout(
    plot_bgcolor="rgba(0,0,0,0)",  # background color inside the plot
    paper_bgcolor="rgba(0,0,0,0)",  # overall background color
    font=dict(color="white"))  # font color
             
            charts_for_sample["bar"] = pio.to_json(bar_fig)

        # --- Pie Chart: contribution to HMPI ---
        if "HMPI" in row and pd.notna(row["HMPI"]) and row["HMPI"] > 0:
            total_hmpi = row["HMPI"]
            pie_data = []
            for metal in metal_columns:
                si_col = f"{metal}_SIi"
                if si_col in row and pd.notna(row[si_col]):
                    pie_data.append({"Metal": metal, "Contribution": row[si_col]})
            pie_df = pd.DataFrame(pie_data)

            if not pie_df.empty:
                pie_fig = px.pie(
                    pie_df,
                    values="Contribution",
                    names="Metal",
                    title=f"HMPI Contribution for {sample_id}",
                )
                pie_fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    font=dict(color="white")
)
                charts_for_sample["pie"] = pio.to_json(pie_fig)
        
        # --- Radar Chart: Concentration vs. Standard Limits ---
        radar_metals = []
        radar_actuals = []
        radar_limits = []

        for metal, col in metal_columns.items():
            if col in df.columns and pd.notna(row[col]) and STANDARD_LIMITS.get(metal, 0) > 0:
                radar_metals.append(metal)
                radar_actuals.append(row[col])
                radar_limits.append(STANDARD_LIMITS.get(metal))

        if radar_metals:
            # Add the first metal again to close the radar loop
            radar_metals.append(radar_metals[0])
            radar_actuals.append(radar_actuals[0])
            radar_limits.append(radar_limits[0])

            radar_fig = go.Figure()

            # Trace for Actual Concentrations
            radar_fig.add_trace(go.Scatterpolar(
                r=radar_actuals,
                theta=radar_metals,
                fill='toself',
                name='Actual Concentration'
            ))

            # Trace for Standard Limits (WHO/Regulatory)
            radar_fig.add_trace(go.Scatterpolar(
                r=radar_limits,
                theta=radar_metals,
                fill='toself',
                name='Standard Limit'
            ))

            radial_max = max(max(radar_actuals), max(radar_limits)) if radar_actuals and radar_limits else 1
            
            radar_fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, radial_max * 1.1] # Add 10% buffer
                    )),
                showlegend=True,
                title=f"Metal Levels vs. Limits for {sample_id}"
            )
            radar_fig.update_layout(
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
    font=dict(color="white"),
    polar=dict(
        bgcolor="rgba(0,0,0,0)",  # transparent inside radar plot
        radialaxis=dict(visible=True),
        angularaxis=dict(visible=True)
    )
)
            charts_for_sample["radar"] = pio.to_json(radar_fig)

        if charts_for_sample:
            sample_charts[sample_id] = charts_for_sample

    return sample_charts


@app.route("/charts/<file_id>", methods=["GET"])
def get_charts(file_id):
    try:
        doc = samples_collection.find_one({"_id": file_id})
        if not doc:
            return jsonify({"error": "File not found"}), 404

        geojson_data = doc["GeoJSON"]
        df = pd.DataFrame(geojson_data)

        # Expand all_metal_conc into separate columns
        if "all_metal_conc" in df.columns:
            metals_expanded = pd.json_normalize(df["all_metal_conc"]).add_prefix("")
            df = pd.concat([df.drop(columns=["all_metal_conc"]), metals_expanded], axis=1)

        # Detect metals present
        metal_cols = {m: m for m in df.columns if m in STANDARD_LIMITS}

        # Compute HMPI
        df_hmpi = compute_hmpi_vectorized(df, metal_cols)

        charts = {}

        # --- Global Line Chart ---
        df_clean = df_hmpi.replace([np.inf, -np.inf], np.nan).dropna(subset=["HMPI"])
        if not df_clean.empty:
            line_fig = px.line(df_clean, x=df_clean.index, y="HMPI", title="HMPI Trend Over Samples")
            line_fig.update_layout(
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
    font=dict(color="white")
)
            charts["line_chart"] = json.loads(pio.to_json(line_fig))

            # --- Risk Distribution Pie ---
            bins = [0, 60, 100, np.inf]
            labels = ["Safe (≤60)", "Moderate (61–100)", "High (>100)"]
            df_clean["RiskCategory"] = pd.cut(df_clean["HMPI"], bins=bins, labels=labels, right=True)
            risk_counts = df_clean["RiskCategory"].value_counts().reset_index()
            risk_counts.columns = ["RiskCategory", "count"]

            pie_fig = px.pie(risk_counts, values="count", names="RiskCategory", title="Risk Distribution")
            pie_fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    font=dict(color="white")
)
            charts["pie_chart"] = json.loads(pio.to_json(pie_fig))

        # --- Heatmap (if geometry exists) ---
        if "geometry" in df.columns:
            coords = df.dropna(subset=["geometry"]).copy()
            coords["Longitude"] = coords["geometry"].apply(
                lambda g: g["coordinates"][0] if isinstance(g, dict) else None
            )
            coords["Latitude"] = coords["geometry"].apply(
                lambda g: g["coordinates"][1] if isinstance(g, dict) else None
            )
            if not coords.empty:
                heatmap_fig = px.density_map(
                    coords,
                    lat="Latitude",
                    lon="Longitude",
                    z="HMPI",
                    radius=30,
                    center=dict(lat=coords["Latitude"].mean(), lon=coords["Longitude"].mean()),
                    zoom=8,
                    map_style="stamen-terrain",
                )
                heatmap_fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    font=dict(color="white")
)
                charts["heatmap"] = json.loads(pio.to_json(heatmap_fig))

        # --- Per-sample charts ---
        charts["sample_charts"] = generate_sample_charts(df_hmpi, metal_cols)

        return jsonify(charts), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/register", methods=["POST"])
def register_user():
    name = request.json["name"]
    email = request.json["email"]

    user_doc = {"name": name, "email": email}
    result = db.users.insert_one(user_doc)

    return jsonify({"msg": "User registered", "user_id": str(result.inserted_id)}), 201

@app.route("/user/<user_id>", methods=["GET"])
def get_user(user_id):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user["_id"] = str(user["_id"])
    return jsonify(user)

@app.route("/process", methods=["POST"])
def process_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    user_id = request.form.get("user_id", "anonymous")
    
    try:
        # Load file
        df = load_file(file)
        
        # Calculate tokens required based on row count
        row_count = len(df)
        tokens_required = calculate_tokens(row_count)
        
        # If tokens required, check user balance
        if tokens_required > 0:
            user = db.users.find_one({"_id": user_id})
            current_tokens = user.get("tokens", 0) if user else 0
            
            if current_tokens < tokens_required:
                return jsonify({
                    "error": "Insufficient tokens",
                    "current_tokens": current_tokens,
                    "tokens_required": tokens_required,
                    "row_count": row_count,
                    "message": f"This dataset has {row_count} rows and requires {tokens_required} token(s) to process. You currently have {current_tokens} token(s). Please purchase more tokens."
                }), 403
            
            # Deduct tokens from user account
            db.users.update_one(
                {"_id": user_id},
                {"$inc": {"tokens": -tokens_required}, "$set": {"last_updated": datetime.utcnow()}},
                upsert=False
            )

        # Run pipeline
        df_clean, merged_cols = preprocess_dataframe(df)
        df_hmpi = compute_hmpi_vectorized(df_clean, merged_cols)

        # Only consider metals actually present in the DataFrame
        valid_metals_for_geo = [m for m in merged_cols if m in df_hmpi.columns]

        # Build GeoJSON features
        features = []
        for _, row in df_hmpi.iterrows():
            metal_conc = {m: row[m] for m in valid_metals_for_geo if pd.notna(row[m])}
            latlon_flag = pd.notna(row.get("Latitude")) and pd.notna(row.get("Longitude"))

            features.append({
                "Sample_ID": row.get("Sample_ID", str(uuid.uuid4())),
                "no_of_metals": len(metal_conc),
                "all_metal_conc": metal_conc,
                "geometry": {
                    "type": "Point",
                    "coordinates": [row.get("Longitude"), row.get("Latitude")]
                },
                "latitudeandlongitudepresent": latlon_flag,
               "HMPI": round(row.get("HMPI", 0), 4) if pd.notna(row.get("HMPI")) else None

            })

        # Save to samples collection
        doc_id = str(uuid.uuid4())
        samples_collection.insert_one({
            "_id": doc_id,
            "GeoJSON": features,
            "created_at": datetime.utcnow(),
            "user_id": user_id,
            "row_count": row_count,
            "tokens_used": tokens_required
        })

        # Get updated token balance
        updated_user = db.users.find_one({"_id": user_id})
        new_balance = updated_user.get("tokens", 0) if updated_user else 0

        return jsonify({
            "file_id": doc_id, 
            "GeoJSON": features,
            "row_count": row_count,
            "tokens_used": tokens_required,
            "new_token_balance": new_balance
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/geojson/<file_id>', methods=['GET'])
def get_geojson(file_id):
    doc = samples_collection.find_one({'_id': file_id})
    if not doc:
        return jsonify({'error': 'GeoJSON not found'}), 404
    return jsonify(doc['GeoJSON'])


# REPLACE your existing @app.route('/download/<file_id>', methods=['GET']) function with this:

@app.route('/download/<file_id>', methods=['GET'])
def download_file(file_id):
    doc = samples_collection.find_one({'_id': file_id})
    if not doc:
        return jsonify({'error': 'File not found'}), 404

    # Convert GeoJSON back to tabular format for CSV download
    geojson_data = doc['GeoJSON']
    
    # Build rows for CSV
    rows = []
    for feature in geojson_data:
        row = {
            'Sample_ID': feature.get('Sample_ID', ''),
            'HMPI': feature.get('HMPI', ''),
            'no_of_metals': feature.get('no_of_metals', ''),
        }
        
        # Add coordinates if available
        if feature.get('geometry') and feature['geometry'].get('coordinates'):
            coords = feature['geometry']['coordinates']
            row['Longitude'] = coords[0] if len(coords) > 0 else ''
            row['Latitude'] = coords[1] if len(coords) > 1 else ''
        else:
            row['Longitude'] = ''
            row['Latitude'] = ''
        
        # Add all metal concentrations
        if feature.get('all_metal_conc'):
            row.update(feature['all_metal_conc'])
            
        rows.append(row)
    
    # Create DataFrame and CSV
    df = pd.DataFrame(rows)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    
    return Response(
        csv_buffer.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename=processed_{file_id}.csv"}
    )
CHART_WIDTH = 3.0 * inch
CHART_HEIGHT = 2.0 * inch

def create_df_table_data(df: pd.DataFrame, columns_to_include: list) -> list:
    """Converts a DataFrame subset into a list of lists format for ReportLab Table."""
    # Ensure all columns exist before selecting
    cols = [col for col in columns_to_include if col in df.columns]
    
    # Header row
    data = [[str(col) for col in cols]]
    
    # Data rows, formatting float values
    for index, row in df.iterrows():
        row_data = []
        for col in cols:
            value = row.get(col)
            if pd.isna(value):
                row_data.append("N/A")
            elif isinstance(value, (int, float)):
                row_data.append(f"{value:.4f}")
            else:
                row_data.append(str(value))
        data.append(row_data)
    return data

def generate_pdf_report(df_hmpi: pd.DataFrame, all_charts: dict, file_id: str) -> BytesIO:
    """
    Generates a PDF report using ReportLab, including data tables and charts.
    
    Args:
        df_hmpi: DataFrame containing the HMPI and calculated indices (all samples).
        all_charts: Dictionary containing sample charts {Sample_ID: {chart_type: base64_png_string}}
        file_id: The unique ID of the file being reported.
        
    Returns:
        A BytesIO buffer containing the PDF file.
    """
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            title=f"HMPI Report - {file_id}",
                            leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                            topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    
    styles = getSampleStyleSheet()
    story = []
    
    # --- Title Page / Header ---
    story.append(Paragraph("Heavy Metal Pollution Index (HMPI) Analysis Report", styles['Title']))
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph(f"File ID: <b>{file_id}</b>", styles['Normal']))
    story.append(Paragraph(f"Total Samples Analyzed: {len(df_hmpi)}", styles['Normal']))
    story.append(Paragraph(f"Date Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 0.5 * inch))
    
    # --- HMPI Summary Table ---
    story.append(Paragraph("1. Overall HMPI Data Summary", styles['h2']))
    story.append(Spacer(1, 0.1 * inch))
    
    # Define columns to show in the summary table
    summary_cols = ['Sample_ID', 'HMPI'] + [col for col in df_hmpi.columns if col.endswith('_SIi')]
    
    table_data = create_df_table_data(df_hmpi, summary_cols)
    
    # Calculate column widths dynamically, aiming for a total width of 6.5 inches
    col_count = len(table_data[0])
    # Give Sample_ID and HMPI slightly more space
    col_widths = [1.0 * inch] + [(6.5 * inch - 1.0 * inch) / (col_count - 1)] * (col_count - 1)
    
    data_table = Table(table_data, colWidths=col_widths)
    data_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E4053')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black)
    ]))
    
    story.append(data_table)
    story.append(Spacer(1, 0.5 * inch))
    
    # --- Charts Section (Start on a new page) ---
    story.append(PageBreak())
    story.append(Paragraph("2. Individual Sample Visualizations", styles['h1']))
    story.append(Spacer(1, 0.25 * inch))
    
    
    for sample_id, charts in all_charts.items():
        # Display sample header
        hmpi_val = df_hmpi.loc[df_hmpi['Sample_ID'] == sample_id, 'HMPI'].iloc[0] if sample_id in df_hmpi['Sample_ID'].values else 'N/A'
        story.append(Paragraph(f"<b>Sample ID: {sample_id}</b> (HMPI: {hmpi_val:.4f})", styles['h3']))
        story.append(Spacer(1, 0.1 * inch))

        chart_labels = {
            "bar": "A. Concentration Bar Chart",
            "pie": "B. HMPI Contribution Pie Chart",
            "radar": "C. Levels vs. Standards Radar Chart"
        }

        # Organize charts for two-column layout
        chart_pairs = [list(charts.keys())[i:i + 2] for i in range(0, len(charts), 2)]
        
        for pair in chart_pairs:
            row_elements = []
            
            for chart_key in pair:
                base64_img = charts.get(chart_key)
                if base64_img:
                    # Decode base64 PNG string back into image data
                    image_data = base64.b64decode(base64_img)
                    img_data_buffer = BytesIO(image_data)
                    
                    # Create Image object and pair it with its title
                    img = Image(img_data_buffer, width=CHART_WIDTH, height=CHART_HEIGHT)
                    label = Paragraph(f"<i>{chart_labels.get(chart_key, chart_key)}</i>", styles['Normal'])
                    
                    # We create a nested list to represent the content of one column
                    row_elements.append([label, img])
                else:
                    # Placeholder if a chart is missing
                    row_elements.append([Paragraph("Chart N/A", styles['Normal']), Spacer(1, CHART_HEIGHT)])

            # Ensure we always have two columns, even if only one chart is available
            while len(row_elements) < 2:
                row_elements.append([Spacer(1, 0.1 * inch), Spacer(1, CHART_HEIGHT)])
            
            # Reorganize the data for the two-column table: 
            # Row 1: [Label 1, Label 2]
            # Row 2: [Image 1, Image 2]
            table_row_data = [
                [row_elements[0][0], row_elements[1][0]],
                [row_elements[0][1], row_elements[1][1]]
            ]

            chart_table = Table(table_row_data, colWidths=[CHART_WIDTH, CHART_WIDTH])

            chart_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 0),
                ('TOPPADDING', (0, 1), (-1, 1), 0),
                ('LEFTPADDING', (0, 0), (0, -1), 0),
                ('RIGHTPADDING', (1, 0), (1, -1), 0),
            ]))
            
            story.append(chart_table)
            story.append(Spacer(1, 0.25 * inch))
            
        # Add page break or space before next sample
        if list(all_charts.keys())[-1] != sample_id:
             story.append(Spacer(1, 0.75 * inch))
             # Optional: use PageBreak() for a very long report

    # --- Build the PDF ---
    try:
        doc.build(story)
    except Exception as e:
        print(f"Error building PDF with ReportLab: {e}")
        raise e

    buffer.seek(0)
    return buffer
@app.route("/export-pdf/<file_id>", methods=["GET"])
def export_pdf(file_id):
    try:
        # Fetch the sample document
        doc = samples_collection.find_one({'_id': file_id})
        if not doc:
            return jsonify({'error': 'File not found'}), 404

        geojson_data = doc['GeoJSON']
        df = pd.DataFrame(geojson_data)

        # Expand all_metal_conc into columns
        if "all_metal_conc" in df.columns:
            metals_expanded = pd.json_normalize(df["all_metal_conc"])
            df = pd.concat([df.drop(columns=["all_metal_conc"]), metals_expanded], axis=1)

        # Detect metals present
        metal_cols = {metal: metal for metal in df.columns if metal in STANDARD_LIMITS}

        if not metal_cols:
            return jsonify({'error': 'No heavy metal data found'}), 400

        # Compute HMPI
        df_hmpi = compute_hmpi_vectorized(df, metal_cols)

        # Generate PDF
        pdf_buffer = generate_pdf_report(df_hmpi, metal_cols)  # must return BytesIO

        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"HMPI_Report_{file_id}.pdf",
            mimetype="application/pdf"
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route("/hmpi-charts-csv", methods=["POST"])
def hmpi_charts_csv():
    try:
        data = request.json
        geojson_data = data.get("GeoJSON") or data.get("file_data")
        if not geojson_data:
            return jsonify({"error": "GeoJSON not provided"}), 400

        rows = []
        for sample in geojson_data:
            sample_id = sample.get("Sample_ID", "Unknown")
            conc = sample.get("all_metal_conc", {})
            limits = {metal: STANDARD_LIMITS.get(metal, 0) for metal in conc.keys()}

            row = {"Sample_ID": sample_id}

            # Bar/Radar chart data (rounding to 4 decimals)
            for metal, value in conc.items():
                row[f"{metal}_Actual"] = round(float(value), 4) if value is not None else None
                row[f"{metal}_Limit"] = round(float(limits.get(metal, 0)), 4)

            # Pie chart data (just actuals, rounded)
            row["Pie_Values"] = ",".join([f"{float(v):.4f}" for v in conc.values() if v is not None])

            # Heatmap (round correlations too)
            if len(conc) > 1:
                df = pd.DataFrame([conc])
                corr = df.corr().round(4)  # round correlations to 4 decimals
                row["Heatmap"] = corr.to_csv(index=True, float_format="%.4f")
            else:
                row["Heatmap"] = "1.0000"

            rows.append(row)

        # Convert all rows to DataFrame
        csv_df = pd.DataFrame(rows)

        # Write CSV with 4 decimal places
        csv_buffer = io.StringIO()
        csv_df.to_csv(csv_buffer, index=False, float_format="%.4f")

        return Response(
            csv_buffer.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=hmpi_charts.csv"}
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ========== PREDICTIONS ENDPOINTS ==========

def load_predictions_csv():
    """Load and parse predictions CSV file"""
    try:
        predictions_file = "future_hmpi_predictions_2026.csv"
        if not os.path.exists(predictions_file):
            return None
        df = pd.read_csv(predictions_file)
        return df
    except Exception as e:
        import traceback
        traceback.print_exc()
        return None

@app.route("/predictions/data", methods=["GET"])
def get_predictions_data():
    """Get all predictions data from CSV"""
    try:
        df = load_predictions_csv()
        if df is None:
            return jsonify({"error": "Predictions file not found"}), 404

        predictions = []
        for _, row in df.iterrows():
            predictions.append({
                "date": str(row.get("Date", "")),
                "sample_id": str(row.get("Sample_ID", "")),
                "latitude": float(row.get("Latitude", 0)),
                "longitude": float(row.get("Longitude", 0)),
                "arima": round(float(row.get("Predicted_HMPI_ARIMA", 0)), 2),
                "svm": round(float(row.get("Predicted_HMPI_SVM", 0)), 2),
                "ensemble": round(float(row.get("Predicted_HMPI_Ensemble", 0)), 2)
            })

        metadata = {
            "models": ["ARIMA", "SVM", "Ensemble"],
            "samples_count": df["Sample_ID"].nunique(),
            "date_range": {
                "start": str(df["Date"].min()),
                "end": str(df["Date"].max())
            }
        }

        return jsonify({"predictions": predictions, "metadata": metadata}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/predictions/comparison", methods=["GET"])
def get_predictions_comparison():
    """Get aggregated predictions for comparison charts"""
    try:
        df = load_predictions_csv()
        if df is None:
            return jsonify({"error": "Predictions file not found"}), 404

        # Aggregate by date across all models
        monthly_data = []
        for date in df["Date"].unique():
            month_df = df[df["Date"] == date]
            monthly_data.append({
                "date": str(date),
                "arima_mean": round(float(month_df["Predicted_HMPI_ARIMA"].mean()), 2),
                "arima_std": round(float(month_df["Predicted_HMPI_ARIMA"].std()), 2),
                "svm_mean": round(float(month_df["Predicted_HMPI_SVM"].mean()), 2),
                "svm_std": round(float(month_df["Predicted_HMPI_SVM"].std()), 2),
                "ensemble_mean": round(float(month_df["Predicted_HMPI_Ensemble"].mean()), 2),
                "ensemble_std": round(float(month_df["Predicted_HMPI_Ensemble"].std()), 2)
            })

        # Calculate overall statistics
        overall_stats = {
            "arima": {
                "min": round(float(df["Predicted_HMPI_ARIMA"].min()), 2),
                "max": round(float(df["Predicted_HMPI_ARIMA"].max()), 2),
                "mean": round(float(df["Predicted_HMPI_ARIMA"].mean()), 2)
            },
            "svm": {
                "min": round(float(df["Predicted_HMPI_SVM"].min()), 2),
                "max": round(float(df["Predicted_HMPI_SVM"].max()), 2),
                "mean": round(float(df["Predicted_HMPI_SVM"].mean()), 2)
            },
            "ensemble": {
                "min": round(float(df["Predicted_HMPI_Ensemble"].min()), 2),
                "max": round(float(df["Predicted_HMPI_Ensemble"].max()), 2),
                "mean": round(float(df["Predicted_HMPI_Ensemble"].mean()), 2)
            }
        }

        return jsonify({
            "monthly_data": monthly_data,
            "overall_stats": overall_stats
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/predictions/spatial-data", methods=["GET"])
def get_predictions_spatial():
    """Get spatial predictions data for Leaflet map"""
    try:
        df = load_predictions_csv()
        if df is None:
            return jsonify({"error": "Predictions file not found"}), 404

        # Get latest month predictions for each sample
        latest_date = df["Date"].max()
        latest_df = df[df["Date"] == latest_date].copy()

        # Group by sample (get average across dates)
        sample_groups = df.groupby("Sample_ID").agg({
            "Latitude": "first",
            "Longitude": "first",
            "Predicted_HMPI_Ensemble": "mean"
        }).reset_index()

        # Create features for Leaflet
        features = []
        for _, row in sample_groups.iterrows():
            ensemble_val = float(row["Predicted_HMPI_Ensemble"])
            sample_id = str(row["Sample_ID"])

            # Determine risk category
            if ensemble_val <= 60:
                risk_category = "Safe"
                color = "#22c55e"  # Green
            elif ensemble_val <= 100:
                risk_category = "Moderate"
                color = "#eab308"  # Yellow
            else:
                risk_category = "Risk"
                color = "#ef4444"  # Red

            # Get latest predictions for this sample
            sample_latest = latest_df[latest_df["Sample_ID"] == sample_id]
            if not sample_latest.empty:
                arima = float(sample_latest["Predicted_HMPI_ARIMA"].iloc[0])
                svm = float(sample_latest["Predicted_HMPI_SVM"].iloc[0])
                ensemble = float(sample_latest["Predicted_HMPI_Ensemble"].iloc[0])
            else:
                arima = svm = ensemble = ensemble_val

            # Calculate trend (first vs last ensemble value)
            sample_data = df[df["Sample_ID"] == sample_id].sort_values("Date")
            if len(sample_data) > 1:
                first_ensemble = float(sample_data.iloc[0]["Predicted_HMPI_Ensemble"])
                last_ensemble = float(sample_data.iloc[-1]["Predicted_HMPI_Ensemble"])
                trend = "increasing" if last_ensemble > first_ensemble else "decreasing" if last_ensemble < first_ensemble else "stable"
            else:
                trend = "stable"

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(row["Longitude"]), float(row["Latitude"])]
                },
                "properties": {
                    "sample_id": sample_id,
                    "ensemble_avg": round(ensemble_val, 2),
                    "ensemble_latest": round(ensemble, 2),
                    "arima_latest": round(arima, 2),
                    "svm_latest": round(svm, 2),
                    "risk_category": risk_category,
                    "color": color,
                    "trend": trend
                }
            })

        return jsonify({
            "type": "FeatureCollection",
            "features": features,
            "latest_date": str(latest_date)
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
@app.route("/predictions/sample-trend/<sample_id>", methods=["GET"])
def get_sample_trend(sample_id):
    try:
        df = load_predictions_csv()
        if df is None:
            return jsonify({"error": "Predictions file not found"}), 404

        sample_df = df[df["Sample_ID"] == sample_id].sort_values("Date")

        if sample_df.empty:
            return jsonify({"error": "Sample not found"}), 404

        trend_data = []
        for _, row in sample_df.iterrows():
            trend_data.append({
                "date": str(row["Date"]),
                "arima": round(float(row["Predicted_HMPI_ARIMA"]), 2),
                "svm": round(float(row["Predicted_HMPI_SVM"]), 2),
                "ensemble": round(float(row["Predicted_HMPI_Ensemble"]), 2),
            })

        return jsonify({
            "sample_id": sample_id,
            "trend": trend_data
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/predictions/cluster-zones", methods=["GET"])
def get_cluster_zones():
    try:
        df = load_predictions_csv()
        if df is None:
            return jsonify({"error": "Predictions file not found"}), 404

        # Use ensemble average per sample
        grouped = df.groupby("Sample_ID").agg({
            "Latitude": "first",
            "Longitude": "first",
            "Predicted_HMPI_Ensemble": "mean"
        }).reset_index()

        # Prepare clustering features (lat, lon, hmpi)
        features = grouped[["Latitude", "Longitude", "Predicted_HMPI_Ensemble"]].values

        scaler = StandardScaler()
        scaled = scaler.fit_transform(features)

        clustering = DBSCAN(eps=1.2, min_samples=2).fit(scaled)
        grouped["cluster"] = clustering.labels_

        clusters = []
        for cluster_id in grouped["cluster"].unique():
            cluster_points = grouped[grouped["cluster"] == cluster_id]

            if cluster_id == -1:
                continue  # skip noise

            avg_hmpi = cluster_points["Predicted_HMPI_Ensemble"].mean()

            if avg_hmpi <= 60:
                risk = "Safe"
                color = "#22c55e"
            elif avg_hmpi <= 100:
                risk = "Moderate"
                color = "#eab308"
            else:
                risk = "High"
                color = "#ef4444"

            clusters.append({
                "cluster_id": int(cluster_id),
                "avg_hmpi": round(float(avg_hmpi), 2),
                "risk_category": risk,
                "color": color,
                "points": cluster_points[["Latitude", "Longitude"]].values.tolist()
            })

        return jsonify({"clusters": clusters}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/predictions/csv-download", methods=["GET"])
def download_predictions_csv():
    """Download the predictions CSV file"""
    try:
        predictions_file = "future_hmpi_predictions_2026.csv"
        if not os.path.exists(predictions_file):
            return jsonify({"error": "Predictions file not found"}), 404

        return send_file(
            predictions_file,
            as_attachment=True,
            download_name="future_hmpi_predictions_2026.csv",
            mimetype="text/csv"
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
>>>>>>> 8386802 (i love nandani)
