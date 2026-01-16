from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import uuid
import os

app = FastAPI()

# CORS (Node 연동 대비)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모델 로딩 (서버 시작 시 1번만)
model = YOLO("best.pt")

UPLOAD_DIR = "images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    # 파일 저장
    filename = f"{uuid.uuid4()}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    # 이미지 로드
    img = cv2.imread(filepath)

    # YOLO 추론
    results = model(img)

    detections = []

    for r in results:
        for box in r.boxes:
            detections.append({
                "label": model.names[int(box.cls[0])],
                "confidence": float(box.conf[0])
            })

    return {
        "success": True,
        "detections": detections
    }
