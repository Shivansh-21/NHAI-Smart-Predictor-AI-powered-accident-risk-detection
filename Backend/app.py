from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd

app = Flask(__name__)
CORS(app)

# load model
model = pickle.load(open("model.pkl", "rb"))

# load weather mapping
weather_map = pickle.load(open("weather_map.pkl", "rb"))
reverse_weather_map = {v: k for k, v in weather_map.items()}

def decode_risk(val):
    return "Low" if val == 0 else "High"

@app.route("/")
def home():
    return "NHAI API Running"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        vehicles = int(data.get("vehicles", 0))
        speed = int(data.get("speed", 0))
        casualties = int(data.get("casualties", 0))
        weather = data.get("weather", "")

        # 🔥 RULE 1 (same as your logic)
        if weather in ["Fog", "Snow"]:
            risk = "High"

        # 🔥 RULE 2 (same logic)
        elif casualties >= 4 or speed > 40:
            risk = "High"

        elif casualties <= 3 and speed <= 40:
            risk = "Low"

        else:
            # ML fallback (same)
            weather_code = reverse_weather_map.get(weather, 0)

            input_data = pd.DataFrame([{
                "Number_of_Vehicles": vehicles,
                "Speed_limit": speed,
                "Number_of_Casualties": casualties,
                "Weather_Conditions": weather_code
            }])

            prediction = model.predict(input_data)[0]
            risk = decode_risk(prediction)

        # 🔥 ADD ONLY THIS (score, logic untouched)
        score = int((speed * 0.5) + (casualties * 20) + (vehicles * 2))
        score = max(0, min(score, 100))

        return jsonify({
            "risk": risk,
            "score": score
        })

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)