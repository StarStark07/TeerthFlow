# TeerthFlow
# 🛕 Crowd Level Detection Dashboard for Temples

A real-time crowd monitoring and visualization system using ESP8266-based IR sensors, a Flask backend, and a React frontend. Designed to help pilgrims and administrators monitor people counts and crowd levels in temples.

---

## 📸 Project Overview

This system uses:

- ESP8266 microcontrollers with IR sensors to detect people entering and exiting.
- A Flask backend to receive and process data from ESPs over HTTP.
- A React dashboard to visualize real-time crowd levels per temple.

---

## 📦 Features

✅ Real-time crowd detection  
✅ Crowd categorization: Low / Medium / High  
✅ Per-temple tracking with dynamic updates  
✅ WebSocket support for live updates (optional)  
✅ Mobile-friendly dashboard UI

---

## 🚀 Getting Started
## 🧠 Requirements
- Node.js (v16+)
- Python (3.10+)
- Flask & Flask-CORS
- React (Vite or Create React App)
- ESP8266 module (NodeMCU recommended)

---

## 🐍 Backend Setup
📁 Go to the backend directory:

```bash
cd backend
````
---

🛠️ Create a virtual environment (optional):

````bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
````
---
📦 Install dependencies:

```bash
pip install -r requirements.txt
```
---

▶️ Run the backend:
```bash
python app.py
````
Backend will start on: http://localhost:5000

---
##⚛️ Frontend Setup
📁 Go to the frontend directory:

```bash
cd frontend
```
---
📦 Install dependencies:

```bash
npm install
```
---

▶️ Start the dev server:

```bash
npm run dev
```
Frontend runs on: http://localhost:5173

---
##📡 ESP8266 Firmware
- Program the ESP8266 with the Arduino sketch in firmware/esp8266_crowd_counter.ino

- Update Wi-Fi SSID, Password, and backend IP address in the code

- IR sensors should be connected to D1 (entry) and D2 (exit)


## 🧠 How Crowd Level is Calculated

| People Count | Crowd Level |
|--------------|-------------|
| 0–20         | Low         |
| 21–40        | Medium      |
| 41+          | High        |

You can customize this logic in app.py.

##✍️ Contributing
Pull requests are welcome! If you’d like to add new features (e.g., forecast prediction, historical graph), feel free to fork and improve.
