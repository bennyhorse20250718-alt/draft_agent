import axios from "axios";
import type {
  DocumentRecord,
  DraftRequest,
  DraftResponse,
  ExportRequest,
  SearchRequest,
  SearchResult,
} from "./types";

const BASE = "/api";

// ── Documents ──────────────────────────────────────────────────────────────

export async function listDocuments(): Promise<DocumentRecord[]> {
  const { data } = await axios.get(`${BASE}/documents/`);
  return data;
}

export async function uploadDocumentJson(payload: {
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}): Promise<DocumentRecord> {
  const { data } = await axios.post(`${BASE}/documents/`, payload);
  return data;
}

export async function uploadDocumentFile(
  formData: FormData
): Promise<DocumentRecord> {
  const { data } = await axios.post(`${BASE}/documents/upload-file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await axios.delete(`${BASE}/documents/${id}`);
}

// ── Search ─────────────────────────────────────────────────────────────────

export async function searchDocuments(
  request: SearchRequest
): Promise<SearchResult[]> {
  const { data } = await axios.post(`${BASE}/search/`, request);
  return data;
}

// ── Draft ──────────────────────────────────────────────────────────────────

export async function generateDraft(
  request: DraftRequest
): Promise<DraftResponse> {
  const { data } = await axios.post(`${BASE}/draft/generate`, request);
  return data;
}

// ── Export ─────────────────────────────────────────────────────────────────

export async function exportDocument(request: ExportRequest): Promise<void> {
  const response = await axios.post(
    `${BASE}/draft/export/${request.format}`,
    request,
    { responseType: "blob" }
  );

  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${request.title.replace(/\s+/g, "_")}.${request.format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
