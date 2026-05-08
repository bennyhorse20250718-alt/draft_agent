"use client";

import type { DocType, FormState, Tone, DocumentLength } from "@/lib/types";

interface Props {
  value: FormState;
  onChange: (v: FormState) => void;
  onSubmit: () => void;
  loading: boolean;
}

const DOC_TYPES: { label: string; value: DocType }[] = [
  { label: "Official Reply", value: "official_reply" },
  { label: "Press Release", value: "press_release" },
  { label: "Other", value: "other" },
];
const TONES: { label: string; value: Tone }[] = [
  { label: "Formal", value: "formal" },
  { label: "Assertive", value: "assertive" },
  { label: "Neutral", value: "neutral" },
];
const LENGTHS: { label: string; value: DocumentLength }[] = [
  { label: "Short (~200 words)", value: "short" },
  { label: "Medium (~400 words)", value: "medium" },
  { label: "Long (~700 words)", value: "long" },
];

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="radio-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          data-selected={value === opt.value}
          className="radio-pill"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function Step1Form({ value, onChange, onSubmit, loading }: Props) {
  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Step 1 — Describe Your Document
      </h2>

      <div className="space-y-6">
        {/* Document type */}
        <div>
          <span className="label">Document Type</span>
          <RadioGroup
            options={DOC_TYPES}
            value={value.docType}
            onChange={(v) => set("docType", v)}
          />
        </div>

        {/* Topic */}
        <div>
          <label className="label" htmlFor="topic">
            Topic / Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="topic"
            className="input"
            placeholder="e.g. Infrastructure development in the Northern District"
            value={value.topic}
            onChange={(e) => set("topic", e.target.value)}
          />
        </div>

        {/* Key points */}
        <div>
          <label className="label" htmlFor="keyPoints">
            Key Points / Requirements
          </label>
          <textarea
            id="keyPoints"
            className="input min-h-[90px] resize-y"
            placeholder="List the main points the document should cover…"
            value={value.keyPoints}
            onChange={(e) => set("keyPoints", e.target.value)}
          />
        </div>

        {/* Tone */}
        <div>
          <span className="label">Tone</span>
          <RadioGroup
            options={TONES}
            value={value.tone}
            onChange={(v) => set("tone", v)}
          />
        </div>

        {/* Length */}
        <div>
          <span className="label">Length</span>
          <RadioGroup
            options={LENGTHS}
            value={value.length}
            onChange={(v) => set("length", v)}
          />
        </div>

        <button
          className="btn-primary w-full"
          onClick={onSubmit}
          disabled={!value.topic.trim() || loading}
        >
          {loading ? "Searching…" : "Search References →"}
        </button>
      </div>
    </div>
  );
}
