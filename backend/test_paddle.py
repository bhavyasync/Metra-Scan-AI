from pathlib import Path
from paddleocr import PaddleOCR

# Find the newest image in processed/
processed_dir = Path("processed")

images = [
    p for p in processed_dir.iterdir()
    if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
]

if not images:
    raise FileNotFoundError("No images found in processed/")

image_path = max(images, key=lambda p: p.stat().st_mtime)

print(f"\nTesting image: {image_path}\n")

ocr = PaddleOCR(
    use_doc_orientation_classify=True,
    use_doc_unwarping=True,
    use_textline_orientation=True,
)

results = ocr.predict(str(image_path))

print("\n========== OCR RESULT ==========\n")

for result in results:
    data = result.json if hasattr(result, "json") else result

    print(data)

print("\n========== END ==========\n")