import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createNote, deleteNote, fetchHealth, fetchNotes } from "./api";
import { formatRelative, formatWhen } from "./dates";
import { SAMPLE_DIFF } from "./sample";
import type { NoteRecord, Tag } from "./types";

const tagStyles: Record<Tag, string> = {
  bug: "bg-red-100 text-red-800",
  risk: "bg-amber-100 text-amber-800",
  question: "bg-blue-100 text-blue-800",
  nit: "bg-slate-100 text-slate-700",
};

export function App() {
  const queryClient = useQueryClient();
  const [diffText, setDiffText] = useState("");
  const [title, setTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  });

  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedId(note.id);
      setDiffText("");
      setTitle("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedId(null);
    },
  });

  const notes = notesQuery.data ?? [];
  const selected = notes.find((n) => n.id === selectedId) ?? null;
  const isPending = createMutation.isPending || notesQuery.isPending;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (diffText.trim().length < 40) return;
    createMutation.mutate({ diffText, title: title || undefined });
  }

  function loadSample() {
    setDiffText(SAMPLE_DIFF);
    setTitle("Sample auth change");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">DiffNote</h1>
            <p className="text-sm text-slate-600">Paste a unified diff. Get file-level review notes.</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {healthQuery.data ? (
              <>
                <div>{healthQuery.data.ai === "model" ? healthQuery.data.model : "offline notes"}</div>
                <div>store: {healthQuery.data.store}</div>
              </>
            ) : (
              "loading…"
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-medium">Diff</label>
            <textarea
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
              rows={12}
              className="w-full rounded border border-slate-300 p-3 font-mono text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Paste a unified diff…"
            />
            <div className="mt-3 flex items-center gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional title"
                className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={loadSample}
                className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
              >
                Load sample
              </button>
              <button
                type="submit"
                disabled={isPending || diffText.trim().length < 40}
                className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {createMutation.isPending ? "Reading…" : "Review diff"}
              </button>
            </div>
            {createMutation.isError && (
              <p className="mt-2 text-sm text-red-600">
                {createMutation.error instanceof Error ? createMutation.error.message : "Request failed."}
              </p>
            )}
          </form>

          {selected && <NoteDetail note={selected} onDelete={() => deleteMutation.mutate(selected.id)} />}
        </section>

        <aside className="space-y-3">
          <h2 className="text-sm font-medium text-slate-700">Saved notes</h2>
          {notesQuery.isPending && <p className="text-sm text-slate-500">Loading…</p>}
          {notes.length === 0 && !notesQuery.isPending && (
            <p className="text-sm text-slate-500">No notes yet.</p>
          )}
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  onClick={() => setSelectedId(note.id)}
                  className={`w-full rounded border p-3 text-left text-sm hover:bg-slate-50 ${
                    selectedId === note.id ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="font-medium">{note.title || "Untitled review"}</div>
                  <div className="text-xs text-slate-500">
                    {formatWhen(note.createdAt)} · {formatRelative(note.createdAt)}
                  </div>
                  <div className="mt-1 text-xs">
                    {note.result.source === "model" ? note.result.model : "offline"} · {note.result.comments.length} notes
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}

function NoteDetail({ note, onDelete }: { note: NoteRecord; onDelete: () => void }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{note.title || "Review"}</h2>
          <p className="text-sm text-slate-600">{note.result.summary}</p>
          <p className="mt-1 text-xs text-slate-500">
            {note.result.source === "model" ? `Model: ${note.result.model}` : "Offline notes (no model)"} ·{" "}
            {formatWhen(note.createdAt)}
          </p>
        </div>
        <button onClick={onDelete} className="text-xs text-red-600 hover:underline">
          Delete
        </button>
      </div>
      <ul className="space-y-3">
        {note.result.comments.map((c, i) => (
          <li key={i} className="rounded border border-slate-100 p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${tagStyles[c.tag]}`}>{c.tag}</span>
              <code className="text-xs text-slate-700">{c.file}</code>
              {c.line != null && <span className="text-xs text-slate-400">:{c.line}</span>}
            </div>
            <p className="text-sm">{c.comment}</p>
          </li>
        ))}
        {note.result.comments.length === 0 && <p className="text-sm text-slate-500">No comments.</p>}
      </ul>
    </article>
  );
}
