import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Generate synthetic dataset for network threat detection (use real datasets like NSL-KDD in production)
np.random.seed(42)
n_samples = 1000
data = {
    'src_ip_num': np.random.randint(1, 256, n_samples),  # Simplified IP feature
    'dst_ip_num': np.random.randint(1, 256, n_samples),
    'protocol_encoded': np.random.choice([0, 1, 2], n_samples),  # 0=TCP, 1=UDP, 2=ICMP
    'port': np.random.randint(1, 65536, n_samples),
    'packet_size': np.random.randint(50, 1500, n_samples),
    'duration': np.random.exponential(10, n_samples),
}
df = pd.DataFrame(data)

# Synthetic labels: 1=Attack (e.g., UDP on high ports more likely attack), balanced ~30%
df['label'] = np.where((df['protocol_encoded'] == 1) & (df['port'] > 1024), 1, 0)
df['label'] = np.random.binomial(1, 0.3, n_samples)  # Adjust for balance

# Prepare features and target
features = ['src_ip_num', 'dst_ip_num', 'protocol_encoded', 'port', 'packet_size', 'duration']
X = df[features]
y = df['label']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
accuracy = model.score(X_test, y_test)
print(f"Model Accuracy: {accuracy:.2f}")

# Save model
joblib.dump(model, "threat_model.pkl")
print("Model saved as threat_model.pkl")

# Save protocol encoder
protocol_encoder = LabelEncoder()
protocol_encoder.fit(['TCP', 'UDP', 'ICMP'])
joblib.dump(protocol_encoder, "protocol_encoder.pkl")
print("Protocol encoder saved as protocol_encoder.pkl")