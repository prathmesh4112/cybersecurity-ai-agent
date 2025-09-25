from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

model = joblib.load("threat_model.pkl")
protocol_encoder = joblib.load("protocol_encoder.pkl")

alerts = []

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    required_fields = ['src_ip', 'dst_ip', 'protocol', 'port']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    df = pd.DataFrame([data])
    df['protocol_encoded'] = protocol_encoder.transform([df['protocol'].iloc[0]])[0]
    df['src_ip_num'] = int(data['src_ip'].split('.')[-1])
    df['dst_ip_num'] = int(data['dst_ip'].split('.')[-1])
    df['port'] = pd.to_numeric(data['port'], errors='coerce')
    df['packet_size'] = np.random.randint(50, 1500)
    df['duration'] = np.random.exponential(10)

    features = ['src_ip_num', 'dst_ip_num', 'protocol_encoded', 'port', 'packet_size', 'duration']
    df_model = df[features].fillna(0)

    try:
        prediction = model.predict(df_model)[0]
        probability = model.predict_proba(df_model)[0].max() if hasattr(model, 'predict_proba') else None
        label = "Attack" if prediction == 1 else "Normal"

        alert = {
            "data": data,
            "result": label,
            "probability": round(probability, 3) if probability else None,
            "timestamp": datetime.now().isoformat()
        }
        alerts.append(alert)

        return jsonify({"prediction": label, "probability": round(probability, 3) if probability else None})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/alerts", methods=["GET"])
def get_alerts():
    return jsonify(alerts[-50:])

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
