import os

os.environ["PADDLE_DISABLE_ONEDNN"] = "1"

from pathlib import Path
from paddleocr import PaddleOCR

processed_dir = Path("processed")

images = [
    p for p in processed_dir.iterdir()
    if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
]

if not images:
    raise FileNotFoundError("No images found in processed/")

image_path = max(images, key=lambda p: p.stat().st_mtime)

print("Testing:", image_path)

ocr = PaddleOCR(
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
)

result = ocr.predict(str(image_path))

for res in result:
    print(res)