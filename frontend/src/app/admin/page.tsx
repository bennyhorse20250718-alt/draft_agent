"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listDocuments,
  uploadDocumentJson,
  uploadDocumentFile,
  deleteDocument,
} from "@/lib/api";
import type { DocType, DocumentLength, DocumentRecord, Tone } from "@/lib/types";

const DOC_TYPES: { label: string; value: DocType }[] = [
  { label: "Official Reply", value: "official_reply" },
  { label: "Press Release", value: "press_release" },
  { label: "Other", value: "other" },
];
const TONES: Tone[] = ["formal", "assertive", "neutral"];
const LENGTHS: DocumentLength[] = ["short", "medium", "long"];

export default function AdminPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>("official_reply");
  const [topicCategory, setTopicCategory] = useState("");
  const [tone, setTone] = useState<Tone>("formal");
  const [responseLength, setResponseLength] = useState<DocumentLength>("medium");
  const [date, setDate] = useState("");
  const [department, setDepartment] = useState("");
  const [language, setLanguage] = useState("English");
  const [inputMode, setInputMode] = useState<"text" | "file">("text");

  const loadDocs = useCallback(async () => {
    setLoadingList(true);
    try {
      setDocs(await listDocuments());
    } catch {
      setError("Failed to load documents.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      if (inputMode === "file" && file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", title);
        fd.append("doc_type", docType);
        fd.append("topic_category", topicCategory);
        fd.append("tone", tone);
        fd.append("response_length", responseLength);
        if (date) fd.append("date", date);
        if (department) fd.append("department", department);
        fd.append("language", language);
        await uploadDocumentFile(fd);
      } else {
        await uploadDocumentJson({
          title,
          content,
          metadata: {
            doc_type: docType,
            topic_category: topicCategory,
            tone,
            response_length: responseLength,
            date: date || null,
            department: department || null,
            language,
          },
        });
      }
      setSuccess("Document uploaded and indexed successfully!");
      setTitle("");
      setContent("");
      setFile(null);
      setTopicCategory("");
      await loadDocs();
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Upload failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deleteDocument(id);
      setDocs((d) => d.filter((doc) => doc.id !== id));
    } catch {
      setError("Failed to delete document.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">
        📂 Manage Reference Documents
      </h2>

      {/* ── Upload form ── */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Upload New Document</h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input mode toggle */}
          <div className="flex gap-3">
            <button
              type="button"
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                inputMode === "text"
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setInputMode("text")}
            >
              Paste Text
            </button>
            <button
              type="button"
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                inputMode === "file"
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setInputMode("file")}
            >
              Upload File (PDF / DOCX)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="label">Title *</label>
              <input
                className="input"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Official Reply on Infrastructure (2023)"
              />
            </div>

            {/* Content or file */}
            {inputMode === "text" ? (
              <div className="sm:col-span-2">
                <label className="label">Content *</label>
                <textarea
                  className="input min-h-[160px] resize-y"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste the full document text here…"
                />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="label">File *</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  required={inputMode === "file"}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            {/* Doc type */}
            <div>
              <label className="label">Document Type *</label>
              <select
                className="input"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic category */}
            <div>
              <label className="label">Topic Category *</label>
              <input
                className="input"
                required
                value={topicCategory}
                onChange={(e) => setTopicCategory(e.target.value)}
                placeholder="e.g. infrastructure, finance, policy"
              />
            </div>

            {/* Tone */}
            <div>
              <label className="label">Tone *</label>
              <select
                className="input"
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Length */}
            <div>
              <label className="label">Length *</label>
              <select
                className="input"
                value={responseLength}
                onChange={(e) => setResponseLength(e.target.value as DocumentLength)}
              >
                {LENGTHS.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Department */}
            <div>
              <label className="label">Department</label>
              <input
                className="input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Communications"
              />
            </div>

            {/* Language */}
            <div>
              <label className="label">Language</label>
              <input
                className="input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="English"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Uploading…" : "Upload & Index Document"}
          </button>
        </form>
      </div>

      {/* ── Document list ── */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Indexed Documents ({docs.length})
        </h3>

        {loadingList ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : docs.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            No documents indexed yet. Upload your first reference document above.
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="card flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    📄 {doc.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {doc.metadata?.doc_type?.replace("_", " ")} ·{" "}
                    {doc.metadata?.tone} · {doc.metadata?.topic_category}
                    {doc.metadata?.date ? ` · ${doc.metadata.date}` : ""}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {doc.content_preview}
                  </p>
                </div>
                <button
                  className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0 transition-colors"
                  onClick={() => handleDelete(doc.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
