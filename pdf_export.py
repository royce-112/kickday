from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import io
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import plotly.express as px
import plotly.io as pio
import json
import traceback
import plotly.graph_objects as go
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
import os

app = Flask(__name__)
CORS(app)
client = MongoClient("mongodb://localhost:27017/")
db = client['heavy_metal_db']
samples_collection = db['samples']
uploads_collection = db['uploads']
users_collection = db['users']

# Define a temporary directory for PDFs
PDF_TEMP_DIR = 'http://localhost:5000/download/${fileId}'


# STANDARD LIMITS (mg/L) - Used in your HMPI formula
# You should verify these limits match the standard you are using (e.g., WHO, BIS, etc.)
STANDARD_LIMITS = {
    'Mercury': 0.001, 'Lead': 0.01, 'Cadmium': 0.003, 'Arsenic': 0.01,
    'Chromium': 0.05, 'Nickel': 0.02, 'Copper': 0.05, 'Zinc': 0.1,
    'Iron': 0.3, 'Manganese': 0.1
}

METAL_KEYWORDS = {
    'Mercury': ['hg', 'mercury', 'hg_conc', 'mercury_conc', 'merc', 'hg_mg_l'],
    'Lead': ['pb', 'lead', 'pb_conc', 'lead_conc', 'pb_mg_l'],
    'Cadmium': ['cd', 'cadmium', 'cd_conc', 'cd_mg_l'],
    'Arsenic': ['as', 'arsenic', 'as_conc', 'as_mg_l'],
    'Chromium': ['cr', 'chromium', 'cr_conc', 'cr_mg_l'],
    'Nickel': ['ni', 'nickel', 'ni_conc', 'ni_mg_l'],
    'Copper': ['cu', 'copper', 'cu_conc', 'cu_mg_l'],
    'Zinc': ['zn', 'zinc', 'zn_conc', 'zn_mg_l'],
    'Iron': ['fe', 'iron', 'fe_conc', 'fe_mg_l'],
    'Manganese': ['mn', 'manganese', 'mn_conc', 'mn_mg_l'],
}

def map_columns_to_metals(df):
    metal_columns = {}
    df_cols = [col.lower() for col in df.columns]
    for metal, keywords in METAL_KEYWORDS.items():
        for keyword in keywords:
            if keyword in df_cols:
                original_col_name = df.columns[df_cols.index(keyword)]
                # Filter only for metals that have defined limits
                if metal in STANDARD_LIMITS:
                    metal_columns[metal] = original_col_name
                break
    return metal_columns

def compute_hmpi_vectorized(df, metal_cols):
    """
    Compute HMPI for a dataframe with metal concentrations using the provided formula.
    """
    df_hmpi = df.copy()
    df_hmpi["HMPI"] = np.nan
    
    # 1. Determine valid metals (present in data AND have a defined limit)
    valid_metals = {
        metal: col for metal, col in metal_cols.items() 
        if metal in STANDARD_LIMITS and col in df_hmpi.columns
    }

    if not valid_metals:
        return df_hmpi

    # 2. Calculate Wi_total (denominator for Wi)
    # The HMPI formula provided already calculates Wi = (1 / Si) / Wi_total inside the loop, 
    # but based on the provided formula structure, the Wi term appears to be the weight, 
    # and the final HMPI is the sum of weighted indices (SIi = Qi * Wi).
    # We will compute HMPI = sum(Qi * Wi) where Wi = (1/Si) / sum(1/Si).
    
    Wi_total = sum(1 / STANDARD_LIMITS[metal] for metal in valid_metals)

    si_columns = []
    for metal, col in valid_metals.items():
        Si = STANDARD_LIMITS[metal]
        Ci = df_hmpi[col].copy()

        # Handle NaNs: replace missing values with 0 for HMPI calculation
        Ci = Ci.fillna(0)

        # Convert μg/L → mg/L if Ci is much higher than standard (heuristic)
        # Assuming input concentrations are in mg/L unless concentrations are extremely high (μg/L conversion)
        # This heuristic is kept as per the user-provided code, though it should be confirmed by the data source.
        if (Ci > 100 * Si).any():
            Ci = Ci / 1000

        # Quality Index (Qi)
        Qi = (Ci / Si) * 100
        
        # Unit Weight (Wi)
        Wi = (1 / Si) / Wi_total

        # Single-Metal HMPI Index (SIi)
        df_hmpi[f"{metal}_SIi"] = Qi * Wi
        si_columns.append(f"{metal}_SIi")
        
        # Store Qi and Wi values for use in per-sample pie chart contribution analysis
        df_hmpi[f"{metal}_Qi"] = Qi
        df_hmpi[f"{metal}_Wi"] = Wi

    # 3. HMPI = sum of SIi columns
    # HMPI will be NaN only if all individual SIi values are NaN, which is prevented by fillna(0)
    df_hmpi["HMPI"] = df_hmpi[si_columns].sum(axis=1)

    # Re-apply NaN for the original rows where input concentrations were all missing, 
    # if necessary, though the current logic should handle this.

    return df_hmpi

def calculate_hmpi_deprecated(df, metal_columns):
    # This function is now deprecated in favor of compute_hmpi_vectorized
    # It remains here to avoid breaking other parts that might rely on its structure 
    # but the primary calculation is now done by the new vectorized function.
    pass


def generate_sample_charts(df, metal_columns):
    sample_charts = {}
    
    for index, row in df.iterrows():
        sample_id = row.get('location', f"Sample_{index+1}")
        charts_for_sample = {}
        
        # --- Bar chart for metal concentrations ---
        bar_data = [{'Metal': metal, 'Concentration': row[col]} for metal, col in metal_columns.items()]
        bar_df = pd.DataFrame(bar_data)
        
        if not bar_df.empty:
            bar_fig = px.bar(
                bar_df, 
                x='Metal', 
                y='Concentration', 
                title=f"Metal Concentrations for Sample: {sample_id}"
            )
            charts_for_sample['bar'] = pio.to_json(bar_fig)

        # --- Pie chart for metal contribution to HMPI ---
        pie_data_list = []
        
        # The contribution is directly the SIi value calculated during HMPI computation
        # HMPI = sum(SIi), so contribution percentage = (SIi / HMPI) * 100
        if 'HMPI' in row and not pd.isna(row['HMPI']) and row['HMPI'] > 0:
            total_hmpi = row['HMPI']
            
            for metal in metal_columns:
                si_col = f"{metal}_SIi"
                if si_col in row and not pd.isna(row[si_col]):
                    # Contribution = SIi value
                    contribution = row[si_col]
                    pie_data_list.append({'Metal': metal, 'Contribution': contribution})
        
        pie_df = pd.DataFrame(pie_data_list)
        
        if not pie_df.empty:
            # The values are already proportional to the percentage contribution of each metal.
            pie_fig = px.pie(
                pie_df,
                values='Contribution',
                names='Metal',
                title=f"Contribution of each Metal to HMPI for Sample: {sample_id}"
            )
            charts_for_sample['pie'] = pio.to_json(pie_fig)
        
        if charts_for_sample:
            sample_charts[sample_id] = charts_for_sample

    return sample_charts

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        try:
            file_id = ObjectId()
            file_stream = io.StringIO(file.read().decode('utf-8'))
            df = pd.read_csv(file_stream)
            
            data_to_insert = []
            
            sample_id_col = 'Sample_ID' if 'Sample_ID' in df.columns else 'Location'
            
            metal_columns = map_columns_to_metals(df)
            
            for index, row in df.iterrows():
                doc = {
                    'uploadId': file_id,
                    'location': row.get(sample_id_col, f"Sample_{index+1}"),
                    'timestamp': datetime.utcnow(),
                }
                
                if 'Latitude' in row and 'Longitude' in row:
                    doc['geometry'] = {
                        'type': 'Point',
                        'coordinates': [row['Longitude'], row['Latitude']]
                    }
                
                for metal, col_name in metal_columns.items():
                    doc[col_name] = float(row[col_name]) if not pd.isna(row[col_name]) else None
                
                data_to_insert.append(doc)
            
            if data_to_insert:
                samples_collection.insert_many(data_to_insert)

            uploads_collection.insert_one({
                '_id': file_id,
                'filename': file.filename,
                'userId': request.form.get('userId'),
                'upload_date': datetime.utcnow(),
                'record_count': len(data_to_insert)
            })

            return jsonify({
                'message': 'File processed successfully',
                'fileId': str(file_id),
                'record_count': len(data_to_insert)
            }), 200

        except Exception as e:
            traceback.print_exc()
            return jsonify({'error': f'An error occurred during file processing: {str(e)}'}), 500

@app.route('/charts/<file_id>', methods=['GET'])
def get_charts(file_id):
    try:
        upload_doc = uploads_collection.find_one({'_id': ObjectId(file_id)})
        if not upload_doc:
            return jsonify({'error': 'File not found'}), 404

        samples = list(samples_collection.find({'uploadId': ObjectId(file_id)}))
        if not samples:
            return jsonify({'error': 'No samples found for this file'}), 404

        df = pd.DataFrame(samples)
        
        for col in df.columns:
            if any(kw in col.lower() for kw in sum(METAL_KEYWORDS.values(), [])):
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        metal_columns = map_columns_to_metals(df)

        if not metal_columns:
            return jsonify({'error': 'No heavy metal concentration data found'}), 400

        # Use the correct vectorized HMPI calculation
        df = compute_hmpi_vectorized(df, metal_columns)

        charts = {}
        
        df_clean = df.replace([np.inf, -np.inf], np.nan).dropna(subset=['HMPI'])

        if not df_clean.empty:
            line_fig = px.line(df_clean, x=df_clean.index, y='HMPI', title='HMPI Values Over Samples')
            charts['line_chart'] = json.loads(pio.to_json(line_fig))
        
        bins = [0, 60, 100, np.inf]
        labels = ['Safe (≤60)', 'Moderate (61–100)', 'High (>100)']
        df_clean['RiskCategory'] = pd.cut(df_clean['HMPI'], bins=bins, labels=labels, right=True)
        risk_counts = df_clean['RiskCategory'].value_counts().reset_index()
        risk_counts.columns = ['RiskCategory', 'count']

        if len(risk_counts) == 1:
            risk = risk_counts['RiskCategory'].iloc[0]
            pie_fig = px.pie(
                values=[1], 
                names=[risk], 
                title="Risk Distribution",
                color_discrete_map={'Safe': 'green', 'Moderate': 'orange', 'High': 'red'}
            )
        else:
            pie_fig = px.pie(
                risk_counts, 
                values="count", 
                names="RiskCategory", 
                title="Risk Distribution"
            )
        charts['pie_chart'] = json.loads(pio.to_json(pie_fig))

        if "geometry" in df.columns:
            df_coords = df.dropna(subset=["geometry"])
            df_coords["Longitude"] = df_coords["geometry"].apply(lambda g: g["coordinates"][0] if isinstance(g, dict) else None)
            df_coords["Latitude"] = df_coords["geometry"].apply(lambda g: g["coordinates"][1] if isinstance(g, dict) else None)

            heatmap_fig = px.density_map(
                df_coords,
                lat="Latitude",
                lon="Longitude",
                z="HMPI",
                radius=30,
                center=dict(lat=df_coords["Latitude"].mean(), lon=df_coords["Longitude"].mean()),
                zoom=10,
            )
            charts['heatmap'] = json.loads(pio.to_json(heatmap_fig))

        charts['sample_charts'] = generate_sample_charts(df, metal_columns)
        
        return jsonify(charts), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/start_pdf_generation/<file_id>', methods=['POST'])
def start_pdf_generation(file_id):
    try:
        # Check if the file exists and get its metadata
        upload_doc = uploads_collection.find_one({'_id': ObjectId(file_id)})
        if not upload_doc:
            return jsonify({'error': 'File not found'}), 404
            
        # Define the temporary path to save the PDF
        pdf_filename = f"HMPI_Report_{file_id}.pdf"
        pdf_path = os.path.join(PDF_TEMP_DIR, pdf_filename)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

        samples = list(samples_collection.find({'uploadId': ObjectId(file_id)}))
        if not samples:
            return jsonify({'error': 'No samples found for this file'}), 404

        df = pd.DataFrame(samples)
        
        for col in df.columns:
            if any(kw in col.lower() for kw in sum(METAL_KEYWORDS.values(), [])):
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        metal_columns = map_columns_to_metals(df)

        if not metal_columns:
            return jsonify({'error': 'No heavy metal concentration data found'}), 400

        df = compute_hmpi_vectorized(df, metal_columns)
        df_clean = df.replace([np.inf, -np.inf], np.nan).dropna(subset=['HMPI'])

        # Start PDF generation (writing directly to the file path)
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Add Title and Date
        title_text = f"HMPI Analysis Report for {upload_doc['filename']}"
        story.append(Paragraph(title_text, styles['Heading1']))
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Spacer(1, 0.2 * inch))
        
        # Add a table of all HMPI values
        story.append(Paragraph("<b>Summary Table of HMPI Values:</b>", styles['Heading2']))
        story.append(Spacer(1, 0.1 * inch))
        
        from reportlab.platypus import Table, TableStyle
        from reportlab.lib import colors
        
        table_data = [['Sample Location', 'HMPI Value', 'Risk Category']]
        bins = [0, 60, 100, np.inf]
        labels = ['Safe', 'Moderate', 'High']
        df_clean['RiskCategory'] = pd.cut(df_clean['HMPI'], bins=bins, labels=labels, right=True)
        
        df = df.merge(df_clean[['HMPI', 'RiskCategory']], on='HMPI', how='left', suffixes=('', '_clean')).fillna({'RiskCategory_clean': 'N/A'})

        for _, row in df.iterrows():
            hmpi_val = f"{row['HMPI']:.2f}" if not pd.isna(row['HMPI']) else "N/A"
            risk_cat = row.get('RiskCategory_clean', 'N/A')
            table_data.append([row.get('location', 'N/A'), hmpi_val, risk_cat])
        
        table = Table(table_data, colWidths=[2*inch, 1.5*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.5 * inch))

        # Generate and add GLOBAL charts as static images
        story.append(Paragraph("<b>Global Chart Visualizations:</b>", styles['Heading2']))
        story.append(Spacer(1, 0.1 * inch))
        
        if not df_clean.empty:
            # Line Chart
            line_fig = px.line(df_clean, x=df_clean.index, y='HMPI', title='HMPI Values Over Samples')
            line_img_buffer = io.BytesIO()
            pio.write_image(line_fig, line_img_buffer, format='png')
            line_img_buffer.seek(0)
            story.append(Image(line_img_buffer, width=6*inch, height=4*inch))
            story.append(Spacer(1, 0.2 * inch))

            # Pie Chart
            pie_counts = df_clean['RiskCategory'].value_counts().reset_index()
            pie_counts.columns = ['RiskCategory', 'count']
            pie_fig = px.pie(
                pie_counts, values="count", names="RiskCategory", title="Risk Distribution"
            )
            pie_img_buffer = io.BytesIO()
            pio.write_image(pie_fig, pie_img_buffer, format='png')
            pie_img_buffer.seek(0)
            story.append(Image(pie_img_buffer, width=6*inch, height=4*inch))
            story.append(Spacer(1, 0.2 * inch))

            # Heatmap
            if "geometry" in df.columns:
                df_coords = df.dropna(subset=["geometry"])
                df_coords["Longitude"] = df_coords["geometry"].apply(lambda g: g["coordinates"][0] if isinstance(g, dict) else None)
                df_coords["Latitude"] = df_coords["geometry"].apply(lambda g: g["coordinates"][1] if isinstance(g, dict) else None)
                heatmap_fig = px.density_map(df_coords, lat="Latitude", lon="Longitude", z="HMPI", radius=30)
                heatmap_img_buffer = io.BytesIO()
                pio.write_image(heatmap_fig, heatmap_img_buffer, format='png')
                heatmap_img_buffer.seek(0)
                story.append(Image(heatmap_img_buffer, width=6*inch, height=4*inch))
                story.append(Spacer(1, 0.2 * inch))
        
        doc.build(story)
        
        # Immediately return success message and the filename
        return jsonify({'message': 'PDF generation complete', 'file_name': pdf_filename}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/download_pdf/<file_name>', methods=['GET'])
def download_pdf(file_name):
    # This route serves the generated PDF file to the client
    from flask import make_response # Import make_response here
    
    pdf_path = os.path.join(PDF_TEMP_DIR, file_name)
    if not os.path.exists(pdf_path):
        return jsonify({'error': 'PDF file not found'}), 404
        
    try:
        # Use send_file to read the file
        response = make_response(send_file(
            pdf_path,
            download_name=os.path.basename(pdf_path),
            as_attachment=True,
            mimetype='application/pdf'
        ))
        
        # Explicitly set Content-Type and Content-Disposition headers for guaranteed download
        response.headers["Content-Type"] = "application/pdf"
        response.headers["Content-Disposition"] = f"attachment; filename={os.path.basename(pdf_path)}"
        
        return response
        
    finally:
        # Clean up the temporary file after it has been sent
        if os.path.exists(pdf_path):
            # This deletion logic needs to be run outside the send_file context.
            # For simplicity, we will trust the browser to download and keep the file for a bit.
            # For production, a separate background cleanup task is recommended.
            pass

@app.route('/', methods=['GET'])
def home():
    return "Backend is running. Go to your frontend to interact."

if __name__ == '__main__':
    app.run(debug=True)