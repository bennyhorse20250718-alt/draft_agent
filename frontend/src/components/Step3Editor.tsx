"use client";

import { useState } from "react";
import { exportDocument } from "@/lib/api";
import type { Tone } from "@/lib/types";

interface Props {
  draft: string;
  styleNotes: string;
  referenceTitles: string[];
  topic: string;
  onDraftChange: (draft: string) => void;
  onRegenerate: (additionalInstructions: string) => void;
  onChangeTone: (tone: Tone) => void;
  onBack: () => void;
  loading: boolean;
}

const TONES: { label: string; value: Tone }[] = [
  { label: "Formal", value: "formal" },
  { label: "Assertive", value: "assertive" },
  { label: "Neutral", value: "neutral" },
];

export default function Step3Editor({
  draft,
  styleNotes,
  referenceTitles,
  topic,
  onDraftChange,
  onRegenerate,
  onChangeTone,
  onBack,
  loading,
}: Props) {
  const [instructions, setInstructions] = useState("");
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);
  const [showToneMenu, setShowToneMenu] = useState(false);

  const handleExport = async (format: "docx" | "pdf") => {
    setExporting(format);
    try {
      await exportDocument({ content: draft, title: topic, format });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Step 3 — Review &amp; Edit Draft
        </h2>
        <button className="btn-secondary text-sm" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Draft editor ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Draft</span>
              <span className="ml-auto">
                {draft.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              className="w-full min-h-[500px] p-5 text-sm leading-relaxed resize-y focus:outline-none font-mono"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-3">
            {/* Regenerate */}
            <button
              className="btn-secondary"
              onClick={() => onRegenerate(instructions)}
              disabled={loading}
            >
              🔄 {loading ? "Regenerating…" : "Regenerate"}
            </button>

            {/* Tone adjustment */}
            <div className="relative">
              <button
                className="btn-secondary"
                onClick={() => setShowToneMenu((v) => !v)}
                disabled={loading}
              >
                🎚 Adjust Tone ▾
              </button>
              {showToneMenu && (
                <div className="absolute left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => {
                        onChangeTone(t.value);
                        setShowToneMenu(false);
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export DOCX */}
            <button
              className="btn-primary"
              onClick={() => handleExport("docx")}
              disabled={!!exporting || loading}
            >
              {exporting === "docx" ? "Exporting…" : "📥 Export DOCX"}
            </button>

            {/* Export PDF */}
            <button
              className="btn-primary"
              onClick={() => handleExport("pdf")}
              disabled={!!exporting || loading}
            >
              {exporting === "pdf" ? "Exporting…" : "📄 Export PDF"}
            </button>
          </div>

          {/* Optional instructions for regeneration */}
          <div>
            <label className="label" htmlFor="regen-instructions">
              Instructions for regeneration (optional)
            </label>
            <input
              id="regen-instructions"
              className="input"
              placeholder="e.g. Make the closing paragraph more concise"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Style notes */}
          <div className="card">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              📊 Style Analysis
            </h3>
            <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
              {styleNotes}
            </div>
          </div>

          {/* References used */}
          <div className="card">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              📚 References Used
            </h3>
            <ul className="space-y-1">
              {referenceTitles.map((title) => (
                <li key={title} className="text-xs text-gray-600 flex gap-1">
                  <span>•</span>
                  <span>{title}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Human review reminder */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-xs text-amber-800 font-medium">
              ⚠️ Human Review Required
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Always review and verify the generated draft before publishing.
              AI-generated content may require factual correction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
