from pathlib import Path
import cv2
import numpy as np


def load_image(path: str) -> np.ndarray:
    image = cv2.imread(path)

    if image is None:
        raise ValueError(f"Cannot read image: {path}")

    return image


def rotate_image(image: np.ndarray, angle: int) -> np.ndarray:
    if angle == 0:
        return image

    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

    if angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)

    if angle == 270:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)

    raise ValueError("Angle must be 0, 90, 180 or 270")


def upscale(image: np.ndarray, factor: int = 2) -> np.ndarray:
    height, width = image.shape[:2]

    return cv2.resize(
        image,
        (width * factor, height * factor),
        interpolation=cv2.INTER_CUBIC,
    )


def preprocess_variants(image: np.ndarray) -> dict[str, np.ndarray]:
    enlarged = upscale(image, 2)

    gray = cv2.cvtColor(
        enlarged,
        cv2.COLOR_BGR2GRAY,
    )

    clahe = cv2.createCLAHE(
        clipLimit=2.5,
        tileGridSize=(8, 8),
    )

    contrast = clahe.apply(gray)

    denoised = cv2.fastNlMeansDenoising(
        contrast,
        None,
        10,
        7,
        21,
    )

    sharpen_kernel = np.array(
        [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0],
        ],
        dtype=np.float32,
    )

    sharpened = cv2.filter2D(
        denoised,
        -1,
        sharpen_kernel,
    )

    _, otsu = cv2.threshold(
        sharpened,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU,
    )

    adaptive = cv2.adaptiveThreshold(
        sharpened,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        9,
    )

    return {
        "color": enlarged,
        "gray": gray,
        "contrast": contrast,
        "denoised": denoised,
        "sharpened": sharpened,
        "otsu": otsu,
        "adaptive": adaptive,
    }


def quality_score(image: np.ndarray) -> dict:
    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    blur = cv2.Laplacian(
        gray,
        cv2.CV_64F,
    ).var()

    brightness = float(np.mean(gray))

    contrast = float(np.std(gray))

    return {
        "blur_score": round(float(blur), 2),
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "width": int(image.shape[1]),
        "height": int(image.shape[0]),
    }


def save_variant(
    image: np.ndarray,
    output_dir: str,
    name: str,
) -> str:

    directory = Path(output_dir)
    directory.mkdir(parents=True, exist_ok=True)

    path = directory / f"{name}.png"

    cv2.imwrite(str(path), image)

    return str(path)