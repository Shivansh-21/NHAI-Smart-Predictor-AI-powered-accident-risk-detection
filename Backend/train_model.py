import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle

# Load dataset
data = pd.read_csv("Dataset.csv")

# Select columns (WITH WEATHER)
data = data[[
    "Number_of_Vehicles",
    "Speed_limit",
    "Number_of_Casualties",
    "Weather_Conditions",
    "Accident_Severity"
]]

# Drop missing
data = data.dropna()

# Convert target
data["Accident_Severity"] = data["Accident_Severity"].map({
    "Slight": 0,
    "Serious": 1,
    "Fatal": 1
})

# 🔥 Encode weather properly
data["Weather_Conditions"] = data["Weather_Conditions"].astype("category")
weather_mapping = dict(enumerate(data["Weather_Conditions"].cat.categories))
data["Weather_Conditions"] = data["Weather_Conditions"].cat.codes

# Save weather mapping
pickle.dump(weather_mapping, open("weather_map.pkl", "wb"))

# 🔥 Balance data
low = data[data["Accident_Severity"] == 0]
high = data[data["Accident_Severity"] == 1]

min_size = min(len(low), len(high))

low = low.sample(min_size, random_state=42)
high = high.sample(min_size, random_state=42)

data = pd.concat([low, high])
data = data.sample(frac=1, random_state=42)

# Features
X = data[[
    "Number_of_Vehicles",
    "Speed_limit",
    "Number_of_Casualties",
    "Weather_Conditions"
]]

y = data["Accident_Severity"]

# Model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model
pickle.dump(model, open("model.pkl", "wb"))

print("✅ Model trained with WEATHER!")