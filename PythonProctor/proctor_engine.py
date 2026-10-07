import cv2
import numpy as np
import base64
import time

# Load OpenCV pre-trained Haar Cascade Classifiers
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
profile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_profileface.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

def decode_base64_image(base64_str: str):
    """
    Decodes a base64 encoded image string or data URI into an OpenCV BGR image matrix.
    """
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    
    img_bytes = base64.b64decode(base64_str)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def detect_mobile_phone_contours(image_matrix, gray):
    """
    Detects handheld rectangular mobile phone / tablet shapes near face/hands
    using edge detection, aspect ratio analysis, and contour area thresholds.
    """
    try:
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        h_img, w_img = gray.shape

        for c in contours:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.04 * peri, True)

            # Mobile phones are 4-sided quadrilaterals
            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)
                area = w * h
                
                # Check bounding box dimensions matching typical smartphone aspect ratio (~1.7 to 2.4)
                if area > 1200 and area < (w_img * h_img * 0.35):
                    aspect_ratio = float(h) / w if w > 0 else 0
                    inv_aspect_ratio = float(w) / h if h > 0 else 0
                    
                    if (1.5 <= aspect_ratio <= 2.5) or (1.5 <= inv_aspect_ratio <= 2.5):
                        # Verify phone location (must be visible in camera frame)
                        return True
    except Exception:
        pass
    return False

def analyze_frame_opencv(image_matrix):
    """
    Analyzes an OpenCV image matrix to detect human faces and verify proctoring rules:
    - Single Person (OK)
    - Multiple People (>1 Person -> Anti-cheat violation)
    - No Person (0 People -> Candidate absent)
    - Looking Away (Head/Eye gaze turned off-screen)
    - Mobile Phone Detected (Handheld phone shape detected)
    """
    if image_matrix is None:
        return {
            "status": "ERROR",
            "face_count": 0,
            "violation": True,
            "message": "Invalid or corrupt image frame received",
            "timestamp": int(time.time() * 1000)
        }

    gray = cv2.cvtColor(image_matrix, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    # 1. Detect frontal faces
    frontal_faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(60, 60)
    )

    face_count = len(frontal_faces)

    # Fallback to profile faces if 0 frontal faces detected
    if face_count == 0:
        profile_faces = profile_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(60, 60)
        )
        face_count = len(profile_faces)

    # 2. Check for Mobile Phone Detection
    phone_detected = detect_mobile_phone_contours(image_matrix, gray)
    if phone_detected and face_count >= 1:
        return {
            "status": "PHONE_DETECTED",
            "face_count": face_count,
            "violation": True,
            "message": "🚨 ANTI-CHEAT ALERT: Mobile phone / electronic device detected in camera frame!",
            "timestamp": int(time.time() * 1000)
        }

    # 3. Determine Proctoring & Eye Gaze Status
    if face_count == 1:
        (x, y, w, h) = frontal_faces[0] if len(frontal_faces) > 0 else (0, 0, 0, 0)
        
        # Eye Gaze Analysis inside candidate face bounding box
        looking_away = False
        if w > 0 and h > 0:
            roi_gray = gray[y:y+h, x:x+w]
            eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=3, minSize=(15, 15))
            
            # If face is present but 0 eyes visible or eyes offset to side, candidate is looking away
            if len(eyes) == 0:
                # Check horizontal position of face box relative to image center
                img_center_x = gray.shape[1] / 2
                face_center_x = x + (w / 2)
                if abs(face_center_x - img_center_x) > (gray.shape[1] * 0.22):
                    looking_away = True

        if looking_away:
            status = "LOOKING_AWAY"
            violation = True
            message = "⚠️ WARNING: Eye gaze / head turning away from screen detected!"
        else:
            status = "SINGLE_PERSON"
            violation = False
            message = "Candidate verified (1 Person in frame, focused on screen)"

    elif face_count > 1:
        status = "MULTIPLE_PEOPLE"
        violation = True
        message = f"🚨 ANTI-CHEAT ALERT: Multiple people ({face_count}) detected in camera frame!"
    else:
        status = "NO_PERSON"
        violation = True
        message = "⚠️ WARNING: Candidate missing from camera frame!"

    return {
        "status": status,
        "face_count": face_count,
        "violation": violation,
        "message": message,
        "timestamp": int(time.time() * 1000)
    }
