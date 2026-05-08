// Shared TypeScript types — mirrors the backend Pydantic schemas

export type DocType = "official_reply" | "press_release" | "other";
export type Tone = "formal" | "assertive" | "neutral";
export type DocumentLength = "short" | "medium" | "long";

export interface DocumentMetadata {
  doc_type: DocType;
  topic_category: string;
  date?: string;
  tone: Tone;
  response_length: DocumentLength;
  department?: string;
  language: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  content_preview: string;
  metadata: Record<string, string>;
}

export interface SearchRequest {
  doc_type: DocType;
  topic: string;
  key_points?: string;
  tone: Tone;
  length: DocumentLength;
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  content_preview: string;
  similarity_score: number;
  metadata: Record<string, string>;
}

export interface DraftRequest {
  reference_doc_ids: string[];
  doc_type: DocType;
  topic: string;
  key_points?: string;
  tone: Tone;
  length: DocumentLength;
  additional_instructions?: string;
}

export interface DraftResponse {
  draft: string;
  style_notes: string;
  reference_titles: string[];
}

export interface ExportRequest {
  content: string;
  title: string;
  format: "docx" | "pdf";
}

// Step 1 form state
export interface FormState {
  docType: DocType;
  topic: string;
  keyPoints: string;
  tone: Tone;
  length: DocumentLength;
}
