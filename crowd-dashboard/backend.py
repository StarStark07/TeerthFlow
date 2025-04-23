# Ensure eventlet.monkey_patch() is the first import
import eventlet
eventlet.monkey_patch()

from datetime import datetime
from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
import socket
import threading
import json
import os

# Flask and Flask-SocketIO setup
app = Flask(__name__) 
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global data store for temples
temple_data = {}
history_data = []  # Simple in-memory history storage
MAX_HISTORY = 100  # Maximum number of history entries to keep

# Connect and disconnect events
@socketio.on("connect")
def handle_connect():
    print("✅ Frontend connected")
    # Send all current temple data when a client connects
    for temple_name, data in temple_data.items():
        socketio.emit("update_data", data)

@socketio.on("disconnect")
def handle_disconnect():
    print("❌ Frontend disconnected")

# REST API routes for data access
@app.route('/api/temples', methods=['GET'])
def get_all_temples():
    return jsonify({
        "success": True,
        "data": list(temple_data.values())
    })

@app.route('/api/temples/<temple_name>', methods=['GET'])
def get_temple(temple_name):
    if temple_name in temple_data:
        return jsonify({
            "success": True,
            "data": temple_data[temple_name]
        })
    return jsonify({
        "success": False,
        "message": f"Temple {temple_name} not found"
    }), 404

@app.route('/api/history', methods=['GET'])
def get_history():
    temple = request.args.get('temple')
    limit = int(request.args.get('limit', 50))
    
    if temple:
        filtered_history = [record for record in history_data if record.get('temple') == temple]
    else:
        filtered_history = history_data
    
    # Return the most recent entries up to the limit
    limited_history = filtered_history[-limit:] if len(filtered_history) > limit else filtered_history
    
    return jsonify({
        "success": True,
        "count": len(limited_history),
        "data": limited_history
    })

# Helper function to categorize crowd levels
def categorize_crowd(count):
    if count <= 20:
        return "Low"
    elif count <= 40:
        return "Medium"
    else:
        return "High"

# Predict next hour crowd level (simple method)
def predict_next_hour(current_level, temple_name):
    # Filter recent history for this temple
    temple_history = [h for h in history_data if h.get("temple") == temple_name]
    recent = temple_history[-5:] if len(temple_history) >= 5 else temple_history
    
    if not recent:
        return current_level
    
    recent_levels = [r.get("crowdLevel", current_level) for r in recent]
    
    # Simple prediction - if trend is toward higher levels, predict one level up
    if recent_levels and all(level == "High" for level in recent_levels[:3]):
        return "High"
    elif recent_levels and all(level == "Low" for level in recent_levels[:3]):
        return "Low"
    
    # Default to current level
    return current_level

# Socket server to communicate with ESP8266 devices
def socket_server():
    HOST = '0.0.0.0'
    PORT = 1300

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen(5)
    print(f"🚀 ESP socket server running on port {PORT}")

    while True:
        client, address = server.accept()
        print(f"📡 Connection from {address}")
        try:
            request = client.recv(1024).decode()
            print("📡 Received from ESP:\n", request)

            first_line = request.split("\n")[0]  # GET /update?count=5&temple=TempleA HTTP/1.1
            path = first_line.split(" ")[1]
            if "?" in path:
                query = path.split("?")[1]
                params = dict(pair.split("=") for pair in query.split("&"))
                temple = params.get("temple", "Unknown")
                count = int(params.get("count", 0))

                # Categorize crowd level
                level = categorize_crowd(count)
                
                # Create timestamp
                current_time = datetime.now()
                timestamp_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
                
                # Predict next hour
                next_hour_level = predict_next_hour(level, temple)

                # Build data object
                data = {
                    "temple": temple,
                    "peopleCount": count,
                    "crowdLevel": level,
                    "lastUpdated": timestamp_str,
                    "nextHour": next_hour_level
                }

                # Store in memory
                temple_data[temple] = data
                
                # Add to history
                history_data.append(data)
                
                # Trim history if it gets too large
                if len(history_data) > MAX_HISTORY:
                    history_data.pop(0)  # Remove oldest entry
                
                print(f"📢 Emitting to frontend: {data}")
                socketio.emit("update_data", data)  # Emitting to the frontend using SocketIO

                # Send success response to ESP
                response = "HTTP/1.1 200 OK\r\n"
                response += "Content-Type: application/json\r\n\r\n"
                response += json.dumps({"status": "success", "message": "Data received"})
                client.sendall(response.encode())

            else:
                # Handle invalid requests
                client.sendall("HTTP/1.1 400 Bad Request\r\n\r\nInvalid request".encode())

        except Exception as e:
            print("⚠️ Error handling ESP data:", e)
            # Send error response to ESP
            client.sendall("HTTP/1.1 500 Internal Server Error\r\n\r\nServer error".encode())
        
        finally:
            client.close()

if __name__ == "__main__":
    # Start socket server for ESP communication
    thread = threading.Thread(target=socket_server, daemon=True)
    thread.start()

    print("🔥 Starting Flask-SocketIO server...")
    socketio.run(app, host="0.0.0.0", port=5090, debug=True)