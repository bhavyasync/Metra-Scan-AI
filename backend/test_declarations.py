from pathlib import Path
import json

from app.services.ocr_service import (
    extract_text_with_data
)

from app.services.declaration_extractor import (
    extract_declarations
)


processed_dir = Path("processed")

images = [
    image
    for image in processed_dir.glob("*")
    if image.suffix.lower()
    in [".jpg", ".jpeg", ".png"]
]


if not images:

    print("No processed image found.")

else:

    image_path = max(
        images,
        key=lambda file: file.stat().st_mtime
    )

    print(
        f"\nScanning: {image_path}\n"
    )

    # Step 1: OCR
    ocr_result = extract_text_with_data(
        str(image_path)
    )

    if not ocr_result["success"]:

        print("OCR failed:")
        print(
            ocr_result.get("error")
        )

    else:

        # Step 2: Extract declarations
        declarations = extract_declarations(
            ocr_result["text"]
        )

        print(
            "===== STRUCTURED DECLARATIONS =====\n"
        )

        print(
            json.dumps(
                declarations,
                indent=4
            )
        )