"""
Drafting Agent — Step 2 of the workflow.

1. Retrieves selected reference documents from the vector store.
2. Asks the LLM to analyse the collective style of those references.
3. Generates a draft that matches that style and the user's requirements.
"""

from __future__ import annotations

from typing import List

from openai import OpenAI

from app.core.config import settings
from app.models.schemas import DraftRequest, DraftResponse
from app.services.vector_store import vector_store

# ── Prompt templates ──────────────────────────────────────────────────────────

_STYLE_PROMPT = """\
You are an expert communications analyst.
Analyse the WRITING STYLE of the following document(s) and return a concise \
bullet-point summary (max 6 points) covering:
- Tone and register (formal, assertive, neutral)
- Typical sentence and paragraph length
- Common opening / closing conventions
- Vocabulary and phrasing patterns
- Structural conventions (headers, salutations, sign-offs)

--- REFERENCE DOCUMENTS ---
{references}
--- END ---

Respond ONLY with the bullet-point style analysis. No other commentary."""

_DRAFT_PROMPT = """\
You are an expert document drafter for government and corporate communications.

TASK: Write a {doc_type} on the following brief.

REQUIREMENTS
- Topic / Subject : {topic}
- Key Points      : {key_points}
- Desired Tone    : {tone}
- Desired Length  : {length_guide}
- Additional notes: {additional}

STYLE GUIDE (extracted from historical reference documents):
{style_notes}

REFERENCE DOCUMENTS (for style and context — do NOT copy verbatim):
{references}

Write ONLY the final document text. Use proper formatting (salutation, body \
paragraphs, sign-off) appropriate for a {doc_type}. Do not include any \
preamble or commentary."""

_LENGTH_GUIDE = {
    "short": "approximately 150–250 words",
    "medium": "approximately 350–500 words",
    "long": "approximately 600–900 words",
}


class DraftingAgent:
    def __init__(self) -> None:
        self.client = OpenAI(api_key=settings.openai_api_key)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _chat(self, prompt: str, system: str = "") -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            messages=messages,
        )
        return response.choices[0].message.content.strip()

    def _fetch_references(self, doc_ids: List[str]) -> List[dict]:
        docs = []
        for doc_id in doc_ids:
            record = vector_store.get_document(doc_id)
            if record:
                docs.append(record["payload"])
        return docs

    @staticmethod
    def _format_references(docs: List[dict]) -> str:
        parts = []
        for i, doc in enumerate(docs, 1):
            content = doc.get("content", "")[:2500]  # cap per reference
            parts.append(f"[Reference {i}: {doc.get('title', 'Untitled')}]\n{content}")
        return "\n\n".join(parts)

    # ── Public API ────────────────────────────────────────────────────────────

    def run(self, request: DraftRequest) -> DraftResponse:
        # 1. Retrieve reference documents
        ref_docs = self._fetch_references(request.reference_doc_ids)
        if not ref_docs:
            raise ValueError(
                "No reference documents found for the provided IDs. "
                "Please upload documents first or select valid references."
            )

        ref_text = self._format_references(ref_docs)

        # 2. Style analysis
        style_prompt = _STYLE_PROMPT.format(references=ref_text)
        style_notes = self._chat(style_prompt)

        # 3. Draft generation
        draft_prompt = _DRAFT_PROMPT.format(
            doc_type=request.doc_type.value.replace("_", " "),
            topic=request.topic,
            key_points=request.key_points or "Not specified",
            tone=request.tone.value,
            length_guide=_LENGTH_GUIDE.get(request.length.value, "medium length"),
            additional=request.additional_instructions or "None",
            style_notes=style_notes,
            references=ref_text,
        )
        draft = self._chat(draft_prompt)

        reference_titles = [d.get("title", "Untitled") for d in ref_docs]

        return DraftResponse(
            draft=draft,
            style_notes=style_notes,
            reference_titles=reference_titles,
        )


drafting_agent = DraftingAgent()
