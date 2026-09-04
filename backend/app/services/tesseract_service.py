from pathlib import Path

import pytesseract
from PIL import Image


import shutil
import os

tess_bin = shutil.which("tesseract")
if not tess_bin:
    for candidate in [
        r"D:\ocr\tesseract.exe",
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
    ]:
        if os.path.exists(candidate):
            tess_bin = candidate
            break

if tess_bin:
    pytesseract.pytesseract.tesseract_cmd = str(tess_bin)


def extract(
    image_path: str,
    psm: int = 11,
):

    image = Image.open(
        image_path
    )

    data = pytesseract.image_to_data(
        image,
        lang="eng",
        config=f"--oem 3 --psm {psm}",
        output_type=pytesseract.Output.DICT,
    )

    words = []

    for i in range(
        len(data["text"])
    ):

        text = data["text"][i].strip()

        if not text:
            continue

        try:
            confidence = float(
                data["conf"][i]
            )
        except (
            ValueError,
            TypeError,
        ):
            confidence = 0.0

        words.append({
            "text": text,
            "confidence": confidence / 100.0,
            "bbox": [
                int(data["left"][i]),
                int(data["top"][i]),
                int(data["left"][i])
                + int(data["width"][i]),
                int(data["top"][i])
                + int(data["height"][i]),
            ],
            "engine": "tesseract",
        })

    return {
        "engine": "tesseract",
        "words": words,
        "text": " ".join(
            word["text"]
            for word in words
        ),
    }