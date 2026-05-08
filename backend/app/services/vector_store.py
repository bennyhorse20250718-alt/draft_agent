"""
Vector store service — wraps Qdrant client.

Supports:
- Local file-based storage (no Docker required)
- Remote Qdrant server
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointIdsList,
    PointStruct,
    VectorParams,
)

from app.core.config import settings


class VectorStoreService:
    def __init__(self) -> None:
        mode = settings.qdrant_mode.lower()

        # Backward-compat: honour legacy QDRANT_USE_LOCAL flag if QDRANT_MODE
        # was not explicitly set (i.e. still at its default "local").
        if mode == "local" and not settings.qdrant_use_local:
            mode = "selfhosted"

        if mode == "cloud":
            if not settings.qdrant_url or not settings.qdrant_api_key:
                raise ValueError(
                    "QDRANT_MODE=cloud requires QDRANT_URL and QDRANT_API_KEY "
                    "to be set in your .env file."
                )
            self.client = QdrantClient(
                url=settings.qdrant_url,
                api_key=settings.qdrant_api_key,
            )
        elif mode == "selfhosted":
            self.client = QdrantClient(
                host=settings.qdrant_host,
                port=settings.qdrant_port,
            )
        else:
            # local — file-based, no external service required
            self.client = QdrantClient(path=settings.qdrant_local_path)

        self.openai = OpenAI(api_key=settings.openai_api_key)
        self._ensure_collection()

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _ensure_collection(self) -> None:
        existing = {c.name for c in self.client.get_collections().collections}
        if settings.qdrant_collection_name not in existing:
            self.client.create_collection(
                collection_name=settings.qdrant_collection_name,
                vectors_config=VectorParams(
                    size=settings.embedding_dimensions,
                    distance=Distance.COSINE,
                ),
            )

    def _embed(self, text: str) -> List[float]:
        # Truncate to ~8 000 chars to stay within token limits
        truncated = text[:8000]
        response = self.openai.embeddings.create(
            model=settings.embedding_model, input=truncated
        )
        return response.data[0].embedding

    # ── Public API ────────────────────────────────────────────────────────────

    def add_document(
        self,
        title: str,
        content: str,
        metadata: Dict[str, Any],
        doc_id: Optional[str] = None,
    ) -> str:
        if doc_id is None:
            doc_id = str(uuid.uuid4())

        vector = self._embed(content)

        self.client.upsert(
            collection_name=settings.qdrant_collection_name,
            points=[
                PointStruct(
                    id=doc_id,
                    vector=vector,
                    payload={
                        "title": title,
                        "content": content,
                        "content_preview": content[:500],
                        **metadata,
                    },
                )
            ],
        )
        return doc_id

    def search(
        self,
        query: str,
        limit: int = 5,
        filter_by: Optional[Dict[str, str]] = None,
    ) -> List[Dict[str, Any]]:
        query_vector = self._embed(query)

        search_filter: Optional[Filter] = None
        if filter_by:
            conditions = [
                FieldCondition(key=k, match=MatchValue(value=v))
                for k, v in filter_by.items()
                if v
            ]
            if conditions:
                search_filter = Filter(must=conditions)

        hits = self.client.search(
            collection_name=settings.qdrant_collection_name,
            query_vector=query_vector,
            limit=limit,
            query_filter=search_filter,
            with_payload=True,
        )

        return [
            {"id": str(h.id), "score": h.score, "payload": h.payload}
            for h in hits
        ]

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        records = self.client.retrieve(
            collection_name=settings.qdrant_collection_name,
            ids=[doc_id],
            with_payload=True,
        )
        if records:
            return {"id": str(records[0].id), "payload": records[0].payload}
        return None

    def list_documents(self, limit: int = 200) -> List[Dict[str, Any]]:
        records, _ = self.client.scroll(
            collection_name=settings.qdrant_collection_name,
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )
        return [{"id": str(r.id), "payload": r.payload} for r in records]

    def delete_document(self, doc_id: str) -> None:
        self.client.delete(
            collection_name=settings.qdrant_collection_name,
            points_selector=PointIdsList(points=[doc_id]),
        )


# Singleton
vector_store = VectorStoreService()
