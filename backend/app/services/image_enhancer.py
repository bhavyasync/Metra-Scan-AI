"""
MetraScan AI - Advanced Packaging Image Enhancer
Provides multi-strategy image processing for packaging images:
- Dynamic resolution scaling (preserves text edge sharpness)
- CLAHE (Contrast Limited Adaptive Histogram Equalization) in LAB color space
- Glare and shadow compensation
- Adaptive binarization (Otsu + Gaussian) for low-contrast packaging fonts
- Unsharp masking for small thermal / dot-matrix print
"""

import cv2
import numpy as np
from typing import Tuple, List, Dict


def resize_for_ocr(image: np.ndarray, min_dim: int = 1500, max_dim: int = 2400) -> Tuple[np.ndarray, float]:
    """
    Intelligently resizes the image so small characters have sufficient pixel height for OCR.
    """
    h, w = image.shape[:2]
    longest = max(h, w)
    
    if longest < min_dim:
        scale = min_dim / longest
        resized = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        return resized, scale
    elif longest > max_dim:
        scale = max_dim / longest
        resized = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        return resized, scale
    
    return image.copy(), 1.0


def enhance_contrast_lab(image: np.ndarray) -> np.ndarray:
    """
    Applies CLAHE on the L-channel of LAB color space to dramatically boost
    contrast of printed text without introducing color distortion.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=2.8, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    
    merged = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
    return enhanced


def unsharp_mask(image: np.ndarray, sigma: float = 1.5, strength: float = 1.4) -> np.ndarray:
    """
    Sharpens fine packaging print (e.g. 2mm Net Quantity numerals and date stamps).
    """
    blurred = cv2.GaussianBlur(image, (0, 0), sigma)
    sharpened = cv2.addWeighted(image, 1.0 + strength, blurred, -strength, 0)
    return sharpened


def suppress_glare(image: np.ndarray) -> np.ndarray:
    """
    Suppresses specular reflection / glare spots common on glossy plastic and foil laminates.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY)
    
    # Dilate mask slightly to cover glare halo
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask_dilated = cv2.dilate(mask, kernel, iterations=1)
    
    if cv2.countNonZero(mask_dilated) > 0 and cv2.countNonZero(mask_dilated) < (image.shape[0] * image.shape[1] * 0.25):
        try:
            inpainted = cv2.inpaint(image, mask_dilated, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
            return inpainted
        except Exception:
            return image
    return image


def get_ocr_variants(image_path: str) -> Dict[str, np.ndarray]:
    """
    Generates a suite of complementary preprocessed image variants tailored for
    different packaging print techniques (embossed, dark-on-light, light-on-dark, thermal).
    """
    original = cv2.imread(image_path)
    if original is None:
        raise ValueError(f"Unable to read image at path: {image_path}")

    # Step 1: Intelligent scaling
    scaled, _ = resize_for_ocr(original)

    # Step 2: Glare suppression
    glare_reduced = suppress_glare(scaled)

    # Step 3: Color contrast boost (LAB CLAHE)
    enhanced_color = enhance_contrast_lab(glare_reduced)
    sharpened_color = unsharp_mask(enhanced_color)

    # Step 4: Grayscale representations
    gray = cv2.cvtColor(sharpened_color, cv2.COLOR_BGR2GRAY)
    
    clahe_gray = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced_gray = clahe_gray.apply(gray)

    # Step 5: Adaptive Gaussian Thresholding (recovers text under shadows)
    adaptive_thresh = cv2.adaptiveThreshold(
        enhanced_gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        25,
        9
    )

    # Step 6: Inverted thresholding (critical for light text on dark packaging!)
    inverted_thresh = cv2.bitwise_not(adaptive_thresh)

    # Step 7: Morphological opening on threshold (cleans background noise)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned_thresh = cv2.morphologyEx(adaptive_thresh, cv2.MORPH_OPEN, kernel)

    return {
        "enhanced_color": sharpened_color,
        "enhanced_gray": enhanced_gray,
        "adaptive_thresh": cleaned_thresh,
        "inverted_thresh": inverted_thresh,
    }

