import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import templeA from "./assets/templeA.jpg";
import templeB from "./assets/templeB.jpg";
import templeC from "./assets/templeC.jpg";
import "./App.css";

const SOCKET_BACKEND_URL = "ws://192.168.206.90:5090";

// Keys here must match what the backend sends in data.temple
const initialData = {
  KashiVishwanath: {
    name: "KashiVishwanath",
    image: templeA,
    peopleCount: 0,
    lastUpdated: "Loading...",
    nextHour: "N/A",
    crowdLevel: "Loading...",
  },
  TempleB: {
    name: "TempleB",
    image: templeB,
    peopleCount: 0,
    lastUpdated: "Loading...",
    nextHour: "Loading...",
    crowdLevel: "Loading...",
  },
  TempleC: {
    name: "TempleC",
    image: templeC,
    peopleCount: 0,
    lastUpdated: "Loading...",
    nextHour: "Loading...",
    crowdLevel: "Loading...",
  },
};

// Function to get color based on crowd level
const getCrowdLevelColor = (level) => {
  switch (level) {
    case "Low":
      return "#4CAF50"; // Green
    case "Medium":
      return "#FF9800"; // Orange
    case "High":
      return "#F44336"; // Red
    default:
      return "#888888"; // Gray for loading/unknown states
  }
};

function App() {
  const [templeData, setTempleData] = useState(initialData);
  const [selectedTemple, setSelectedTemple] = useState("KashiVishwanath");
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);

  // Fetch initial data and history when component mounts
  useEffect(() => {
    // Fetch temple data from REST API
    fetch(`http://192.168.206.90:5090/api/temples`)
      .then(response => response.json())
      .then(result => {
        if (result.success && result.data && result.data.length > 0) {
          const updatedData = { ...initialData };
          
          result.data.forEach(item => {
            const temple = item.temple;
            if (updatedData[temple]) {
              updatedData[temple] = {
                ...updatedData[temple],
                peopleCount: item.peopleCount,
                lastUpdated: item.lastUpdated,
                nextHour: item.nextHour,
                crowdLevel: item.crowdLevel,
              };
            }
          });
          
          setTempleData(updatedData);
        }
      })
      .catch(error => console.error("Error fetching temple data:", error));
    
    // Get history for the selected temple
    fetchHistory(selectedTemple);
  }, [selectedTemple]);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const socket = io(SOCKET_BACKEND_URL);

    socket.on("connect", () => {
      console.log("✅ Connected to backend socket");
      setConnected(true);
    });

    socket.on("update_data", (data) => {
      console.log("📥 update_data received:", data);

      setTempleData((prev) => {
        const key = data.temple;
        if (!prev[key]) {
          console.warn(`⚠ Unknown temple key: "${key}"`);
          return prev;
        }

        return {
          ...prev,
          [key]: {
            ...prev[key],
            peopleCount: data.peopleCount,
            lastUpdated: data.lastUpdated,
            nextHour: data.nextHour,
            crowdLevel: data.crowdLevel,
          },
        };
      });
      
      // Update history if this update is for the selected temple
      if (data.temple === selectedTemple) {
        setHistory(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 entries
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from backend socket");
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedTemple]);

  // Fetch history data for a specific temple
  const fetchHistory = (temple) => {
    fetch(`http://192.168.206.90:5090/api/history?temple=${temple}&limit=10`)
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          setHistory(result.data || []);
        }
      })
      .catch(error => console.error("Error fetching history:", error));
  };

  const data = templeData[selectedTemple];

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        color: "white",
        backgroundColor: "#1e1e1e",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "36px", fontWeight: "bold" }}>
          Crowd Level Detection
        </h1>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div 
            style={{ 
              width: "12px", 
              height: "12px", 
              borderRadius: "50%", 
              backgroundColor: connected ? "#4CAF50" : "#F44336",
              marginRight: "8px"
            }}
          />
          <span style={{ marginRight: "20px", fontSize: "14px" }}>
            {connected ? "Connected" : "Disconnected"}
          </span>
          <label htmlFor="temple-select" style={{ marginRight: "10px" }}>
            Select Temple:
          </label>
          <select
            id="temple-select"
            value={selectedTemple}
            onChange={(e) => setSelectedTemple(e.target.value)}
            style={{ padding: "5px 10px", fontSize: "16px" }}
          >
            {Object.keys(templeData).map((temple) => (
              <option key={temple} value={temple}>
                {templeData[temple].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", marginTop: "40px" }}>
        <img
          src={data.image}
          alt={selectedTemple}
          style={{
            width: "500px",
            height: "auto",
            borderRadius: "10px",
            marginRight: "40px",
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "15px",
              fontSize: "18px",
              padding: "20px",
              backgroundColor: "#2a2a2a",
              borderRadius: "10px",
              marginBottom: "30px",
            }}
          >
            <div>
              👥 <strong>People Count:</strong> {data.peopleCount}
            </div>
            <div>
              ⏰ <strong>Last Updated:</strong> {data.lastUpdated}
            </div>
            <div>
              ⏳ <strong>Next Hour Prediction:</strong>{" "}
              <span
                style={{
                  color: getCrowdLevelColor(data.nextHour),
                  fontWeight: "bold",
                }}
              >
                {data.nextHour}
              </span>
            </div>
            <div>
              📶 <strong>Current Crowd Level:</strong>{" "}
              <span
                style={{
                  color: getCrowdLevelColor(data.crowdLevel),
                  fontWeight: "bold",
                }}
              >
                {data.crowdLevel}
              </span>
            </div>
          </div>
          
          {/* History Section */}
          {history.length > 0 && (
            <div
              style={{
                backgroundColor: "#2a2a2a",
                borderRadius: "10px",
                padding: "15px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Recent Updates</h3>
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {history.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderBottom: index < history.length - 1 ? "1px solid #444" : "none",
                      fontSize: "14px",
                    }}
                  >
                    <div>
                      {item.lastUpdated}
                    </div>
                    <div>
                      <strong>Count:</strong> {item.peopleCount}
                    </div>
                    <div>
                      <strong>Level:</strong>{" "}
                      <span
                        style={{
                          color: getCrowdLevelColor(item.crowdLevel),
                          fontWeight: "bold",
                        }}
                      >
                        {item.crowdLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;