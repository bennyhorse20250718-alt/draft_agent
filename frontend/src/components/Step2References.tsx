"use client";

import type { SearchResult } from "@/lib/types";

interface Props {
  results: SearchResult[];
  selected: string[];
  onToggle: (id: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  loading: boolean;
}

function SimilarityBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {pct}% match
    </span>
  );
}

function ToneBadge({ tone }: { tone?: string }) {
  if (!tone) return null;
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
      {tone}
    </span>
  );
}

export default function Step2References({
  results,
  selected,
  onToggle,
  onGenerate,
  onBack,
  loading,
}: Props) {
  if (results.length === 0) {
    return (
      <div className="card max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500 mb-4">
          No reference documents found. Please upload documents first via the{" "}
          <strong>Manage Docs</strong> page.
        </p>
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Step 2 — Select Reference Documents
        </h2>
        <button className="btn-secondary text-sm" onClick={onBack}>
          ← Back
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Select one or more documents to use as style references for your draft.
      </p>

      <div className="space-y-3">
        {results.map((doc) => {
          const isSelected = selected.includes(doc.id);
          return (
            <div
              key={doc.id}
              onClick={() => onToggle(doc.id)}
              className={`card cursor-pointer transition-all ${
                isSelected
                  ? "border-brand-500 ring-2 ring-brand-200"
                  : "hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(doc.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 accent-brand-600 h-4 w-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 truncate">
                      📄 {doc.title}
                    </span>
                    <SimilarityBadge score={doc.similarity_score} />
                    <ToneBadge tone={doc.metadata?.tone} />
                    {doc.metadata?.doc_type && (
                      <span className="text-xs text-gray-400">
                        {doc.metadata.doc_type.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {doc.content_preview}
                  </p>
                  {doc.metadata?.date && (
                    <p className="text-xs text-gray-400 mt-1">
                      {doc.metadata.date}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-500">
          {selected.length} document{selected.length !== 1 ? "s" : ""} selected
        </span>
        <button
          className="btn-primary"
          disabled={selected.length === 0 || loading}
          onClick={onGenerate}
        >
          {loading ? "Generating draft…" : "Generate Draft →"}
        </button>
      </div>
    </div>
  );
}
