
from fastapi.responses import FileResponse
import json
import os
import tempfile
from pathlib import Path

from app.services.report_service import generate_pdf_report

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.post("/generate")
async def generate_report(
    file: UploadFile = File(...),
    report_data: str = Form(...),
):
    temp_path = None
    output_path = None

    try:
        # Parse report data
        try:
            data = json.loads(report_data)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=400,
                detail="Invalid report_data JSON",
            ) from exc

        # Validate uploaded file
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file provided",
            )

        # Preserve extension
        extension = Path(file.filename).suffix.lower() or ".jpg"

        # Temporary input image
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temp_file:
            temp_path = temp_file.name
            temp_file.write(await file.read())

        # Generate PDF
        output_path = generate_pdf_report(
            image_path=temp_path,
            report_data=data,
        )

        if not output_path or not os.path.exists(output_path):
            raise HTTPException(
                status_code=500,
                detail="PDF file was not generated",
            )

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="MetraScan_AI_Report.pdf",
        )

    except HTTPException:
        raise

    except Exception as exc:
        print("REPORT GENERATION ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF report: {str(exc)}",
        )

    finally:
        # Remove only the uploaded temporary image.
        # The generated PDF must remain until FileResponse finishes.
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass