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

def detect_mobile_phone_contours(image_matrix, gray, face_boxes=None):
    """
    Detects handheld rectangular mobile phone / tablet / unauthorized device
    using edge detection, adaptive thresholding, aspect ratio (~1.35 to 2.9),
    and rotated minimum bounding rectangle analysis.
    """
    try:
        h_img, w_img = gray.shape
        total_area = float(h_img * w_img)

        # 1. Edge detection with dual Canny and Adaptive Threshold for dark/lit screens
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 30, 120)
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        combined_edges = cv2.bitwise_or(edged, cv2.Canny(thresh, 30, 120))

        # Dilate slightly to bridge small gaps caused by fingers holding the phone
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        dilated = cv2.dilate(combined_edges, kernel, iterations=1)

        # RETR_TREE captures both exterior phone border and interior lit screen rectangle
        contours, _ = cv2.findContours(dilated, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        for c in contours:
            area = cv2.contourArea(c)
            # Area must be between 0.6% and 35% of total webcam frame
            if area < (total_area * 0.006) or area > (total_area * 0.35):
                continue

            # Rotated bounding rectangle for angled/handheld phones
            rect = cv2.minAreaRect(c)
            (cx, cy), (w, h), angle = rect

            side_short = min(w, h)
            side_long = max(w, h)

            if side_short < 18 or side_long < 35:
                continue

            aspect_ratio = side_long / side_short

            # Mobile phones typically have aspect ratios from 1.35 to 2.85
            if 1.35 <= aspect_ratio <= 2.85:
                rect_area = side_short * side_long
                extent = area / rect_area if rect_area > 0 else 0

                # Check polygon approximation
                peri = cv2.arcLength(c, True)
                approx = cv2.approxPolyDP(c, 0.04 * peri, True)

                # Rectangular contour with 4 to 8 vertices or good rectangle extent
                if extent >= 0.45 or (4 <= len(approx) <= 8 and cv2.isContourConvex(approx)):
                    # Ensure candidate's own forehead/eyes aren't flagged as a phone
                    if face_boxes:
                        inside_face = False
                        for (fx, fy, fw, fh) in face_boxes:
                            if fx <= cx <= fx + fw and fy <= cy <= fy + fh:
                                inside_face = True
                                break
                        if inside_face:
                            continue

                    return True
    except Exception:
        pass
    return False

def analyze_eye_gaze(gray, face_box):
    """
    Analyzes eye regions and pupil positioning to detect suspicious eye sight / gaze:
    - Looking straight at screen (OK)
    - Looking left / right away from screen (Looking Away)
    - Looking down at desk / phone / notes (Looking Away)
    - Eyes closed or head tilted sideways (Looking Away)
    Returns: (is_looking_away, reason)
    """
    x, y, w, h = face_box
    if w <= 0 or h <= 0:
        return False, None

    # 1. Check if face is significantly displaced from center of webcam frame (> 24% offset)
    img_center_x = gray.shape[1] / 2.0
    face_center_x = x + (w / 2.0)
    if abs(face_center_x - img_center_x) > (gray.shape[1] * 0.24):
        return True, "Head positioned off-center"

    # 2. Extract upper 55% of the face (eye zone)
    upper_face_h = int(h * 0.55)
    roi_gray = gray[y : y + upper_face_h, x : x + w]

    min_eye_size = max(10, int(w * 0.10))
    eyes = eye_cascade.detectMultiScale(
        roi_gray,
        scaleFactor=1.08,
        minNeighbors=2,
        minSize=(min_eye_size, min_eye_size)
    )

    # If face is clearly visible but 0 eyes are detected in the eye region,
    # the candidate is either looking down (eyelids lowered), eyes closed, or head tilted away
    if len(eyes) == 0:
        return True, "Eyes not visible or looking down"

    deviated_count = 0
    valid_eyes = 0

    for (ex, ey, ew, eh) in eyes:
        if ew < 10 or eh < 10:
            continue

        eye_roi = roi_gray[ey : ey + eh, ex : ex + ew]
        blurred = cv2.GaussianBlur(eye_roi, (5, 5), 0)

        # In grayscale, pupil & iris represent the darkest region in the eye socket
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(blurred)

        pupil_x = min_loc[0]
        pupil_y = min_loc[1]

        ratio_x = float(pupil_x) / float(ew) if ew > 0 else 0.5
        ratio_y = float(pupil_y) / float(eh) if eh > 0 else 0.5

        valid_eyes += 1

        # Center gaze: pupil is centered horizontally between 0.28 and 0.72
        # and vertically between 0.18 and 0.72
        if ratio_x < 0.28 or ratio_x > 0.72 or ratio_y > 0.72 or ratio_y < 0.18:
            deviated_count += 1

    if valid_eyes > 0 and (deviated_count / valid_eyes) >= 0.5:
        return True, "Pupil / eye gaze turned away from screen"

    return False, None

def analyze_frame_opencv(image_matrix):
    """
    Analyzes an OpenCV image matrix to detect human faces and verify proctoring rules:
    - Single Person (OK)
    - Multiple People (>1 Person -> Anti-cheat violation)
    - No Person (0 People -> Candidate absent)
    - Eye Sight / Looking Away (Eyes or head turned away from screen)
    - Mobile Phone / Object Detected (Handheld device detected)
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
        minSize=(50, 50)
    )

    face_count = len(frontal_faces)

    # Check for sideways profile face if 0 frontal faces detected
    if face_count == 0:
        profile_faces = profile_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(50, 50)
        )
        if len(profile_faces) >= 1:
            return {
                "status": "LOOKING_AWAY",
                "face_count": 1,
                "violation": True,
                "message": "LOOKING AWAY: Profile face / looking away from screen detected!",
                "timestamp": int(time.time() * 1000)
            }

    # 2. Check for Mobile Phone / Object Detection
    phone_detected = detect_mobile_phone_contours(image_matrix, gray, frontal_faces)
    if phone_detected:
        return {
            "status": "PHONE_DETECTED",
            "face_count": max(1, face_count),
            "violation": True,
            "message": "OBJECT DETECTED: Mobile phone or unauthorized object detected in camera view!",
            "timestamp": int(time.time() * 1000)
        }

    # 3. Determine Proctoring & Eye Gaze Status
    if face_count == 1:
        face_box = frontal_faces[0]
        looking_away, reason = analyze_eye_gaze(gray, face_box)

        if looking_away:
            status = "LOOKING_AWAY"
            violation = True
            message = f"EYE SIGHT WARNING: Looking away from screen detected! ({reason})"
        else:
            status = "SINGLE_PERSON"
            violation = False
            message = "Candidate verified (1 Person in frame, focused on screen)"

    elif face_count > 1:
        status = "MULTIPLE_PEOPLE"
        violation = True
        message = f"ANTI-CHEAT ALERT: Multiple people ({face_count}) detected in camera frame!"
    else:
        status = "NO_PERSON"
        violation = True
        message = "WARNING: Candidate missing from camera frame!"

    return {
        "status": status,
        "face_count": face_count,
        "violation": violation,
        "message": message,
        "timestamp": int(time.time() * 1000)
    }
