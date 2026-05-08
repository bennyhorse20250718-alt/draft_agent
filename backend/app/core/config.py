from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # OpenAI (still required for embeddings)
    openai_api_key: str = ""

    # OpenRouter (used for LLM/chat completions)
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Qdrant storage mode — three mutually exclusive options:
    #   "local"      — file-based, single machine (default)
    #   "selfhosted" — remote Qdrant server (Docker / VPS)
    #   "cloud"      — Qdrant Cloud (https://cloud.qdrant.io)
    qdrant_mode: str = "local"

    # local mode
    qdrant_local_path: str = "./qdrant_data"

    # selfhosted mode
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # cloud mode
    qdrant_url: str = ""        # e.g. https://xyz-123.eu-central.aws.cloud.qdrant.io
    qdrant_api_key: str = ""    # Qdrant Cloud API key

    qdrant_collection_name: str = "documents"

    # ── backward-compat shim ──────────────────────────────────────────────────
    # Older .env files may still set QDRANT_USE_LOCAL=true/false
    qdrant_use_local: bool = True

    # Embedding
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    # LLM
    llm_model: str = "gpt-4o"
    llm_temperature: float = 0.3

    # Document processing
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # CORS origins (comma-separated in .env)
    allowed_origins: List[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env"}


settings = Settings()
