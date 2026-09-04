from pathlib import Path

from app.services.ocr_service import (
    extract_text_with_data
)


processed_dir = Path(
    "processed"
)


images = [

    image

    for image

    in processed_dir.glob("*")

    if image.suffix.lower()

    in [

        ".jpg",

        ".jpeg",

        ".png"
    ]
]


if not images:

    print(
        "No processed image found."
    )

else:

    image_path = max(

        images,

        key=lambda file:
        file.stat().st_mtime
    )


    print(
        f"\nTesting image: {image_path}\n"
    )


    result = extract_text_with_data(
        str(image_path)
    )


    print(
        "\n===== OCR RESULT =====\n"
    )


    print(
        "Success:",
        result["success"]
    )


    print(
        "Average confidence:",
        result["average_confidence"]
    )


    print(
        "Word count:",
        result["word_count"]
    )


    print(
        "Best variant:",
        result.get(
            "ocr_variant"
        )
    )


    print(
        "Best region:",
        result.get(
            "region"
        )
    )


    print(
        "Best PSM:",
        result.get(
            "psm"
        )
    )


    print(
        "\n===== REGION RESULTS =====\n"
    )


    for region, data in result.get(
        "all_regions",
        {}
    ).items():

        print(
            f"\n----- {region.upper()} -----"
        )

        print(
            "Confidence:",
            data["confidence"]
        )

        print(
            data["text"]
        )


    print(
        "\n===== COMPLETE OCR TEXT =====\n"
    )


    print(
        result["text"]
    )