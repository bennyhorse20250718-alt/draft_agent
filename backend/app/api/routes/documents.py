"""
Documents router — upload, list, and delete reference documents.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.models.schemas import DocumentUploadRequest, DocumentResponse, DocType, Tone, Length, DocumentMetadata
from app.services.vector_store import vector_store
from app.services.document_processor import extract_text

router = APIRouter()


@router.post("/", response_model=DocumentResponse, status_code=201)
def upload_document_json(request: DocumentUploadRequest):
    """Upload a document via JSON body (plain text content)."""
    doc_id = vector_store.add_document(
        title=request.title,
        content=request.content,
        metadata=request.metadata.model_dump(),
    )
    return DocumentResponse(
        id=doc_id,
        title=request.title,
        content_preview=request.content[:400],
        metadata=request.metadata.model_dump(),
    )


@router.post("/upload-file", response_model=DocumentResponse, status_code=201)
async def upload_document_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    doc_type: DocType = Form(...),
    topic_category: str = Form(...),
    tone: Tone = Form(...),
    response_length: Length = Form(...),
    date: str = Form(None),
    department: str = Form(None),
    language: str = Form("English"),
):
    """Upload a PDF or DOCX file and index it."""
    data = await file.read()
    content = extract_text(data, file.filename or "document.txt")

    if not content.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from file.")

    metadata = DocumentMetadata(
        doc_type=doc_type,
        topic_category=topic_category,
        tone=tone,
        response_length=response_length,
        date=date,
        department=department,
        language=language,
    )

    doc_id = vector_store.add_document(
        title=title,
        content=content,
        metadata=metadata.model_dump(),
    )

    return DocumentResponse(
        id=doc_id,
        title=title,
        content_preview=content[:400],
        metadata=metadata.model_dump(),
    )


@router.get("/", response_model=List[DocumentResponse])
def list_documents():
    """Return all indexed documents."""
    records = vector_store.list_documents()
    return [
        DocumentResponse(
            id=r["id"],
            title=r["payload"].get("title", "Untitled"),
            content_preview=r["payload"].get("content_preview", ""),
            metadata={
                k: v
                for k, v in r["payload"].items()
                if k not in ("content", "content_preview", "title")
            },
        )
        for r in records
    ]


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: str):
    """Delete a document by ID."""
    record = vector_store.get_document(doc_id)
    if not record:
        raise HTTPException(status_code=404, detail="Document not found.")
    vector_store.delete_document(doc_id)
