"use client";

import { useState } from "react";
import Step1Form from "@/components/Step1Form";
import Step2References from "@/components/Step2References";
import Step3Editor from "@/components/Step3Editor";
import { searchDocuments, generateDraft } from "@/lib/api";
import type {
  FormState,
  SearchResult,
  DraftResponse,
  Tone,
} from "@/lib/types";

type Step = 1 | 2 | 3;

const INITIAL_FORM: FormState = {
  docType: "official_reply",
  topic: "",
  keyPoints: "",
  tone: "formal",
  length: "medium",
};

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Describe" },
    { n: 2, label: "Select Refs" },
    { n: 3, label: "Edit Draft" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
              current === s.n
                ? "bg-brand-600 text-white"
                : current > s.n
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {current > s.n ? "✓" : s.n}
          </div>
          <span
            className={`ml-2 text-sm font-medium hidden sm:block ${
              current === s.n ? "text-brand-700" : "text-gray-400"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-12 sm:w-20 h-0.5 mx-3 transition-colors ${
                current > s.n ? "bg-green-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draftData, setDraftData] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1 → 2: search ────────────────────────────────────────────────────
  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const results = await searchDocuments({
        doc_type: form.docType,
        topic: form.topic,
        key_points: form.keyPoints || undefined,
        tone: form.tone,
        length: form.length,
        limit: 6,
      });
      setSearchResults(results);
      setSelectedIds([]);
      setStep(2);
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Search failed. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → 3: generate draft ────────────────────────────────────────────
  const handleGenerate = async (additionalInstructions?: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await generateDraft({
        reference_doc_ids: selectedIds,
        doc_type: form.docType,
        topic: form.topic,
        key_points: form.keyPoints || undefined,
        tone: form.tone,
        length: form.length,
        additional_instructions: additionalInstructions || undefined,
      });
      setDraftData(result);
      setStep(3);
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Draft generation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: regenerate with adjusted tone ─────────────────────────────────
  const handleChangeTone = async (newTone: Tone) => {
    setForm((f) => ({ ...f, tone: newTone }));
    await handleGenerate(`Please rewrite the draft in a ${newTone} tone.`);
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div>
      <StepIndicator current={step} />

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {step === 1 && (
        <Step1Form
          value={form}
          onChange={setForm}
          onSubmit={handleSearch}
          loading={loading}
        />
      )}

      {step === 2 && (
        <Step2References
          results={searchResults}
          selected={selectedIds}
          onToggle={toggleSelect}
          onGenerate={() => handleGenerate()}
          onBack={() => setStep(1)}
          loading={loading}
        />
      )}

      {step === 3 && draftData && (
        <Step3Editor
          draft={draftData.draft}
          styleNotes={draftData.style_notes}
          referenceTitles={draftData.reference_titles}
          topic={form.topic}
          onDraftChange={(draft) => setDraftData((d) => d && { ...d, draft })}
          onRegenerate={handleGenerate}
          onChangeTone={handleChangeTone}
          onBack={() => setStep(2)}
          loading={loading}
        />
      )}
    </div>
  );
}
