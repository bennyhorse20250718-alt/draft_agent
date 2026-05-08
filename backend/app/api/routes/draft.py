"""
Draft router — Step 2: generate draft + export endpoints.
"""

from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agents.drafting_agent import drafting_agent
from app.models.schemas import DraftRequest, DraftResponse, ExportRequest
from app.services.export_service import export_docx, export_pdf

router = APIRouter()


@router.post("/generate", response_model=DraftResponse)
def generate_draft(request: DraftRequest):
    """Generate a draft document from selected reference docs + user preferences."""
    try:
        return drafting_agent.run(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Draft generation failed: {exc}")


@router.post("/export/docx")
def export_to_docx(request: ExportRequest):
    """Export the draft to a DOCX file download."""
    data = export_docx(request.content, request.title)
    return StreamingResponse(
        BytesIO(data),
        media_type=(
            "application/vnd.openxmlformats-officedocument"
            ".wordprocessingml.document"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="{request.title.replace(" ", "_")}.docx"'
            )
        },
    )


@router.post("/export/pdf")
def export_to_pdf(request: ExportRequest):
    """Export the draft to a PDF file download."""
    data = export_pdf(request.content, request.title)
    return StreamingResponse(
        BytesIO(data),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{request.title.replace(" ", "_")}.pdf"'
            )
        },
    )
