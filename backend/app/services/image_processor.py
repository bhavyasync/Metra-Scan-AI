import cv2
import numpy as np
from pathlib import Path


def analyze_image_quality(image_path: str):
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Could not read image")

    height, width = image.shape[:2]

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    laplacian = cv2.Laplacian(
        gray,
        cv2.CV_64F
    )

    blur_score = float(laplacian.var())

    brightness = float(np.mean(gray))

    contrast = float(np.std(gray))

    if blur_score < 50:
        blur_status = "VERY_BLURRY"
    elif blur_score < 100:
        blur_status = "BLURRY"
    else:
        blur_status = "GOOD"

    if brightness < 60:
        brightness_status = "TOO_DARK"
    elif brightness > 210:
        brightness_status = "TOO_BRIGHT"
    else:
        brightness_status = "GOOD"

    if contrast < 25:
        contrast_status = "LOW"
    else:
        contrast_status = "GOOD"

    return {
        "width": width,
        "height": height,
        "blur_score": round(blur_score, 2),
        "blur_status": blur_status,
        "brightness": round(brightness, 2),
        "brightness_status": brightness_status,
        "contrast": round(contrast, 2),
        "contrast_status": contrast_status
    }


def preprocess_image(
    image_path: str,
    output_dir: str
):
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Could not read image")

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(gray)

    denoised = cv2.GaussianBlur(
        enhanced,
        (3, 3),
        0
    )

    processed = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11
    )

    output_path = Path(output_dir)

    output_path.mkdir(
        parents=True,
        exist_ok=True
    )

    filename = (
        Path(image_path).stem
        + "_processed.jpg"
    )

    processed_path = (
        output_path / filename
    )

    cv2.imwrite(
        str(processed_path),
        processed
    )

    return str(processed_path)