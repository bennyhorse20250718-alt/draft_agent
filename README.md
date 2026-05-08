# Draft Document AI Agent

An **Agentic RAG** system that retrieves historical official replies and press releases from a vector knowledge base, analyses their writing style, and generates new style-matched drafts using GPT-4o.

---

## Architecture

```
User Input (Step 1)
  → Search Agent   → Qdrant Vector DB  (semantic retrieval)
  → Step 2: user selects reference documents
  → Drafting Agent → GPT-4o            (style analysis + draft generation)
  → Step 3: editable draft → Export DOCX / PDF
```

**Stack**
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TailwindCSS |
| Backend API | FastAPI (Python 3.11) |
| Vector DB | Qdrant (local file-based, no Docker required) |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM | OpenAI `gpt-4o` |
| Document Export | python-docx + fpdf2 |

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- An OpenAI API key

### 1 — Backend

```bash
cd backend

# Copy and fill in your API key
copy .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 2 — Frontend

```bash
cd frontend

npm install
npm run dev
```

Open http://localhost:3000

---

## Usage Guide

### Step A — Upload Reference Documents (Admin)

1. Go to **http://localhost:3000/admin** (Manage Docs page).
2. Paste the text of a historical official reply or press release, or upload a PDF/DOCX.
3. Fill in the metadata (doc type, topic, tone, length, date, department).
4. Click **Upload & Index Document**. The system embeds the content and stores it in Qdrant.
5. Repeat for all historical documents you want as references.

### Step B — Generate a Draft (Main Workflow)

**Step 1 — Describe your document**
- Choose document type (Official Reply / Press Release / Other).
- Enter the topic/subject and key points.
- Set desired tone and length.
- Click **Search References**.

**Step 2 — Select Reference Documents**
- Review the retrieved documents ranked by semantic similarity.
- Select one or more to use as style references.
- Click **Generate Draft**.

**Step 3 — Review & Edit Draft**
- The AI generates a draft matching the style and length of the selected references.
- Edit the draft directly in the text editor.
- Use **Adjust Tone** to regenerate with a different register.
- Use **Regenerate** with optional instructions for targeted changes.
- Export to **DOCX** or **PDF** for submission.

---

## Docker (Production)

```bash
# Copy and configure backend environment
copy backend\.env.example backend\.env
# Edit backend\.env and set OPENAI_API_KEY

docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

---

## Project Structure

```
Project_D/
├── backend/
│   ├── app/
│   │   ├── core/config.py          # Settings (env vars)
│   │   ├── models/schemas.py       # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── vector_store.py     # Qdrant CRUD + search
│   │   │   ├── document_processor.py # PDF/DOCX text extraction
│   │   │   └── export_service.py   # DOCX/PDF generation
│   │   ├── agents/
│   │   │   ├── search_agent.py     # Step 1: semantic retrieval
│   │   │   └── drafting_agent.py   # Step 2: style analysis + generation
│   │   ├── api/routes/
│   │   │   ├── documents.py        # Upload/list/delete endpoints
│   │   │   ├── search.py           # Search endpoint
│   │   │   └── draft.py            # Generate + export endpoints
│   │   └── main.py                 # FastAPI app
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx            # Main 3-step workflow
│       │   └── admin/page.tsx      # Document management
│       ├── components/
│       │   ├── Step1Form.tsx
│       │   ├── Step2References.tsx
│       │   └── Step3Editor.tsx
│       └── lib/
│           ├── api.ts              # API client
│           └── types.ts            # TypeScript types
├── docker-compose.yml
└── README.md
```

---

## Configuration

All backend settings are controlled via `backend/.env`:

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | **Required.** Your OpenAI API key |
| `LLM_MODEL` | `gpt-4o` | Chat model for draft generation |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model |
| `QDRANT_USE_LOCAL` | `true` | Use local file-based Qdrant (no Docker) |
| `QDRANT_LOCAL_PATH` | `./qdrant_data` | Path to store vector data |
| `LLM_TEMPERATURE` | `0.3` | Generation temperature |

---

## Security Notes

- Keep `OPENAI_API_KEY` in `.env` and never commit it.
- For production, add authentication (Auth0 / Azure AD) in front of both services.
- All generated drafts should undergo human review before publishing.
- See `Idea.md` for the full implementation roadmap including RBAC, audit logging, and monitoring.
