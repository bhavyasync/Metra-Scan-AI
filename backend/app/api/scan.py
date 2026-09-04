import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.ocr_service import (
    extract_text_with_data
)

from app.services.declaration_extractor import (
    extract_declarations
)

from app.services.compliance_engine import (
    evaluate_compliance
)


router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BASE_DIR / "uploads"
PROCESSED_DIR = BASE_DIR / "processed"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/scan")
async def scan_product(
    file: UploadFile = File(...)
):

    allowed_types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ]

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, JPEG, PNG "
                "and WEBP images are allowed."
            )
        )


    # ---------------------------------
    # STEP 1: SAVE UPLOADED IMAGE
    # ---------------------------------

    file_extension = os.path.splitext(
        file.filename
    )[1]

    unique_filename = (
        f"{uuid.uuid4()}"
        f"{file_extension}"
    )

    upload_path = (
        UPLOAD_DIR /
        unique_filename
    )

    with open(
        upload_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )


    # ---------------------------------
    # STEP 2: RUN OCR
    # ---------------------------------

    ocr_result = (
        extract_text_with_data(
            str(upload_path)
        )
    )


    if not ocr_result.get("success"):

        raise HTTPException(
            status_code=500,
            detail=(
                ocr_result.get("error")
                or
                "OCR processing failed"
            )
        )


    # ---------------------------------
    # STEP 3: EXTRACT DECLARATIONS
    # ---------------------------------

    declarations = extract_declarations(
        ocr_result["text"],
        ocr_result.get("lines", []),
        image_height=ocr_result.get("image_dimensions", {}).get("height", 1500)
    )


    # ---------------------------------
    # STEP 4: COMPLIANCE CHECK
    # ---------------------------------

    compliance = (
        evaluate_compliance(
            declarations,
            ocr_result[
                "average_confidence"
            ]
        )
    )


    # ---------------------------------
    # STEP 5: RETURN FINAL REPORT
    # ---------------------------------

    result = {

        "status": "success",

        "image": {
            "original_filename":
                file.filename,

            "saved_filename":
                unique_filename,

            "file_size_bytes":
                upload_path.stat().st_size
        },


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
                ),

            # IMPORTANT:
            # Your frontend needs this.
            "text":
                ocr_result.get(
                    "text",
                    ""
                )
        },


        "declarations":
            declarations,


        "compliance":
            compliance
    }


    return result