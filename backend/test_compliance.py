from pathlib import Path
import json

from app.services.ocr_service import (
    extract_text_with_data
)

from app.services.declaration_extractor import (
    extract_declarations
)

from app.services.compliance_engine import (
    evaluate_compliance
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

    # STEP 1: OCR
    ocr_result = extract_text_with_data(
        str(image_path)
    )

    if not ocr_result["success"]:

        print("OCR FAILED")

        print(
            ocr_result.get("error")
        )

    else:

        # STEP 2: Extract declarations
        declarations = extract_declarations(
            ocr_result["text"]
        )

        # STEP 3: Compliance evaluation
        compliance = evaluate_compliance(
            declarations,
            ocr_result[
                "average_confidence"
            ]
        )

        result = {

            "ocr": {
                "confidence":
                    ocr_result[
                        "average_confidence"
                    ],

                "word_count":
                    ocr_result[
                        "word_count"
                    ],

                "variant":
                    ocr_result.get(
                        "ocr_variant"
                    ),

                "psm":
                    ocr_result.get(
                        "psm"
                    )
            },

            "declarations":
                declarations,

            "compliance":
                compliance
        }

        print(
            "\n===== METRASCAN COMPLIANCE REPORT =====\n"
        )

        print(
            json.dumps(
                result,
                indent=4
            )
        )