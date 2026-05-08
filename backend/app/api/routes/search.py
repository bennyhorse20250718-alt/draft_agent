"""
Search router — Step 1: find relevant reference documents.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter

from app.agents.search_agent import search_agent
from app.models.schemas import SearchRequest, SearchResult

router = APIRouter()


@router.post("/", response_model=List[SearchResult])
def search_documents(request: SearchRequest):
    """Semantic search for relevant reference documents."""
    return search_agent.run(request)
