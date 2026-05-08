from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum


class DocType(str, Enum):
    official_reply = "official_reply"
    press_release = "press_release"
    other = "other"


class Tone(str, Enum):
    formal = "formal"
    assertive = "assertive"
    neutral = "neutral"


class Length(str, Enum):
    short = "short"
    medium = "medium"
    long = "long"


# ── Document management ──────────────────────────────────────────────────────

class DocumentMetadata(BaseModel):
    doc_type: DocType
    topic_category: str
    date: Optional[str] = None
    tone: Tone
    response_length: Length
    department: Optional[str] = None
    language: str = "English"


class DocumentUploadRequest(BaseModel):
    title: str
    content: str
    metadata: DocumentMetadata


class DocumentResponse(BaseModel):
    id: str
    title: str
    content_preview: str
    metadata: Dict[str, Any]


# ── Search ────────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    doc_type: DocType
    topic: str
    key_points: Optional[str] = None
    tone: Tone
    length: Length
    limit: int = 5


class SearchResult(BaseModel):
    id: str
    title: str
    content_preview: str
    similarity_score: float
    metadata: Dict[str, Any]


# ── Draft ─────────────────────────────────────────────────────────────────────

class DraftRequest(BaseModel):
    reference_doc_ids: List[str]
    doc_type: DocType
    topic: str
    key_points: Optional[str] = None
    tone: Tone
    length: Length
    additional_instructions: Optional[str] = None


class DraftResponse(BaseModel):
    draft: str
    style_notes: str
    reference_titles: List[str]


# ── Export ────────────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    content: str
    title: str
    format: str  # "docx" | "pdf"
