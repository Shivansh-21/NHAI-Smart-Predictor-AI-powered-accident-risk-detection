import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { motion } from "framer-motion";

function App() {
  const [location, setLocation] = useState("");
  const [vehicles, setVehicles] = useState("");
  const [speed, setSpeed] = useState("");
  const [casualties, setCasualties] = useState("");
  const [weather, setWeather] = useState("");
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState([22.9734, 78.6569]);

  const isValidHighway = (value) => {
    const cleaned = value.trim().toUpperCase();
    if (!/^NH\d+$/.test(cleaned)) return false;
    const number = parseInt(cleaned.replace("NH", ""));
    return number >= 1 && number <= 599;
  };

  const isValid =
    isValidHighway(location) &&
    weather &&
    weather !== "Select Weather";

  const getCoordinates = async (highway) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${highway}+India`
      );
      const data = await res.json();
      if (data.length > 0) {
        setMapPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch {}
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (!isValidHighway(location)) {
      setError("❌ Enter correct highway (NH1 – NH599)");
      setLoading(false);
      return;
    }

    if (!weather || weather === "Select Weather") {
      setError("❌ Please select weather");
      setLoading(false);
      return;
    }

    const res = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vehicles: Number(vehicles),
        speed: Number(speed),
        casualties: Number(casualties),
        weather: weather,
      }),
    });

    const data = await res.json();
    setResult(data.risk);
    setScore(data.score);

    setHistory(prev => [
      { name: location, score: data.score, risk: data.risk },
      ...prev.slice(0, 5)
    ]);

    await getCoordinates(location);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      
      <div style={styles.header}>
        Ministry of Road Transport & Highways | Smart Traffic AI System
      </div>

      <h1 style={styles.title}>🚀 NHAI Smart Predictor</h1>
      <p style={styles.subtitle}>AI-powered accident risk detection</p>

      <div style={styles.card}>
        <input
          placeholder="Location / Highway (NH1 – NH599)"
          style={styles.input}
          onChange={(e) => setLocation(e.target.value)}
        />

        <input placeholder="Number of Vehicles" style={styles.input} onChange={(e)=>setVehicles(e.target.value)} />
        <input placeholder="Speed" style={styles.input} onChange={(e)=>setSpeed(e.target.value)} />
        <input placeholder="Casualties" style={styles.input} onChange={(e)=>setCasualties(e.target.value)} />

        <select style={styles.input} onChange={(e)=>setWeather(e.target.value)}>
          <option>Select Weather</option>
          <option>Fine no high winds</option>
          <option>Raining no high winds</option>
          <option>Fog</option>
          <option>Snow</option>
        </select>

        <p style={{ fontSize: "12px", color: "#888" }}>
          Supported Highways: NH1 – NH599
        </p>

        <div style={{ fontSize: "12px", color: "#888" }}>
          {speed > 80 && "🔴 Dangerous Speed"}
          {speed > 50 && speed <= 80 && "🟠 Moderate Speed"}
          {speed <= 50 && "🟢 Safe Speed"}
        </div>

        <div style={{ fontSize: "13px", minHeight: "18px" }}>
          {speed > 70 && <span style={{ color: "red" }}>⚡ Overspeed </span>}
          {casualties > 2 && <span style={{ color: "orange" }}>⚠ High Casualties</span>}
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{
            ...styles.button,
            opacity: isValid ? 1 : 0.5,
            cursor: isValid ? "pointer" : "not-allowed"
          }}
          onClick={handleSubmit}
          disabled={!isValid}
        >
          {loading ? "Analyzing..." : "Predict Risk"}
        </button>

        {result && (
          <div style={styles.resultBox}>
            <h2 style={{
              color: result === "High" ? "#ff4d4d" : "#4ade80"
            }}>
              🚦 Risk Level: {result}
            </h2>

            <p style={styles.score}>Risk Score: {score}/100</p>

            <div style={styles.progressBg}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${score}%`,
                  background: score > 70 ? "red" : score > 40 ? "orange" : "green"
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 🔥 GRAPH + MAP */}
      {history.length > 0 && (
        <div style={{
          marginTop: "40px",
          display: "flex",
          justifyContent: "center",
          gap: "30px",
          flexWrap: "wrap"
        }}>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              padding: "20px",
              borderRadius: "15px",
              background: "linear-gradient(145deg, #020617, #0f172a)",
              boxShadow: "0 0 40px rgba(59,130,246,0.6)"
            }}
          >
            <h3>📊 Risk Trend</h3>

            <AreaChart width={320} height={220} data={history}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <XAxis dataKey="name" stroke="#aaa"/>
              <YAxis stroke="#aaa"/>
              <Tooltip />

              <Area
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                fill="url(#colorRisk)"
                strokeWidth={3}
              />
            </AreaChart>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 0 30px rgba(34,197,94,0.5)"
            }}
          >
            <MapContainer center={mapPosition} zoom={6} style={{ height: "240px", width: "320px" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={mapPosition}>
                <Popup>{location}</Popup>
              </Marker>
            </MapContainer>
          </motion.div>

        </div>
      )}

      <div style={styles.footer}>
        Developed for NHAI Smart Infrastructure Initiative 🚀
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(to right, #0f172a, #020617)",
    minHeight: "100vh",
    color: "white",
    textAlign: "center",
    paddingTop: "60px",
  },
  header: {
    position: "fixed",
    top: 0,
    width: "100%",
    background: "#020617",
    padding: "10px",
    fontSize: "14px",
    color: "#aaa",
  },
  title: { fontSize: "40px" },
  subtitle: { color: "#aaa" },

  card: {
    margin: "auto",
    marginTop: "30px",
    width: "340px",
    padding: "25px",
    background: "#1e293b",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "0 0 25px rgba(59,130,246,0.4)",
  },

  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "none",
  },

  button: {
    padding: "10px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
  },

  error: { color: "red" },

  resultBox: { marginTop: "10px" },

  score: { color: "#facc15" },

  progressBg: { height: "8px", background: "#333", borderRadius: "5px" },

  progressFill: { height: "100%" },

  footer: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#777"
  }
};

export default App;