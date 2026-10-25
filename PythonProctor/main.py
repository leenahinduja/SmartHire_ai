import uvicorn
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import cv2
import json

from proctor_engine import decode_base64_image, analyze_frame_opencv

app = FastAPI(
    title="SmartHire AI - OpenCV Proctoring Service",
    description="Python OpenCV microservice for real-time candidate anti-cheat and multi-person face detection",
    version="1.0.0"
)

# Enable CORS for Angular Frontend (localhost:4200 & 127.0.0.1:4200) & Spring Boot (localhost:8082)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FrameRequest(BaseModel):
    image: str

@app.get("/")
def health_check():
    return {
        "service": "SmartHire AI Python OpenCV Proctoring Engine",
        "status": "UP",
        "port": 5000,
        "opencv_version": cv2.__version__
    }

@app.post("/api/proctor/analyze")
def analyze_frame_json(payload: FrameRequest):
    """
    Accepts base64 encoded camera frame image from Frontend and runs OpenCV analysis.
    """
    try:
        img_matrix = decode_base64_image(payload.image)
        result = analyze_frame_opencv(img_matrix)
        status = result.get("status", "UNKNOWN")
        faces = result.get("face_count", 0)
        msg = result.get("message", "")
        print(f"[Proctor AI] Status: {status} | Faces: {faces} | Msg: {msg}")
        return result
    except Exception as e:
        print(f"[Proctor AI ERROR] {str(e)}")
        return {
            "status": "ERROR",
            "face_count": 0,
            "violation": True,
            "message": f"Processing error: {str(e)}"
        }

@app.post("/api/proctor/upload-frame")
async def analyze_frame_upload(file: UploadFile = File(...)):
    """
    Accepts multipart binary file upload from Frontend or Spring Boot and runs OpenCV analysis.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_matrix = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        result = analyze_frame_opencv(img_matrix)
        return result
    except Exception as e:
        return {
            "status": "ERROR",
            "face_count": 0,
            "violation": True,
            "message": f"Processing error: {str(e)}"
        }

@app.websocket("/ws/proctor")
async def websocket_proctor_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for continuous frame streaming from Angular meeting room.
    """
    await websocket.accept()
    print("WebSocket Client Connected to Python OpenCV Proctor Service")
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                image_base64 = msg.get("image", "")
            except Exception:
                image_base64 = data

            if image_base64:
                img_matrix = decode_base64_image(image_base64)
                result = analyze_frame_opencv(img_matrix)
                await websocket.send_text(json.dumps(result))
    except WebSocketDisconnect:
        print("WebSocket Client Disconnected")

if __name__ == "__main__":
    print("Starting SmartHire AI Python OpenCV Proctor Service on http://127.0.0.1:5000 ...")
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
