"""
Search Agent — Step 1 of the workflow.

Builds a semantic query from the user's request and retrieves
the most relevant historical documents from the vector store.
"""

from __future__ import annotations

from typing import List

from app.models.schemas import SearchRequest, SearchResult
from app.services.vector_store import vector_store


class SearchAgent:
    def run(self, request: SearchRequest) -> List[SearchResult]:
        # Compose a rich natural-language query for better semantic matching
        query_parts = [
            f"{request.doc_type.value.replace('_', ' ')} document",
            f"about {request.topic}",
        ]
        if request.key_points:
            query_parts.append(f"covering: {request.key_points}")
        query_parts.append(f"tone: {request.tone.value}")
        query = ". ".join(query_parts)

        raw = vector_store.search(query=query, limit=request.limit)

        results: List[SearchResult] = []
        for r in raw:
            payload = r["payload"]
            results.append(
                SearchResult(
                    id=r["id"],
                    title=payload.get("title", "Untitled"),
                    content_preview=payload.get("content_preview", "")[:400],
                    similarity_score=round(r["score"], 4),
                    metadata={
                        k: v
                        for k, v in payload.items()
                        if k not in ("content", "content_preview")
                    },
                )
            )
        return results


search_agent = SearchAgent()
