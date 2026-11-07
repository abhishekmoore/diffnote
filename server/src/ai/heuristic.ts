import parseDiff from "parse-diff";
import type { FileComment, NoteResult } from "../types.js";

export function summarizeDiff(diffText: string): string {
  try {
    const files = parseDiff(diffText);
    if (files.length === 0) return "No files parsed from the diff.";
    const parts = files.map((f) => {
      const name = f.to || f.from || "unknown";
      const added = f.additions ?? 0;
      const deleted = f.deletions ?? 0;
      return `${name} (+${added}/-${deleted})`;
    });
    return `Files: ${parts.join("; ")}. Hunks: ${files.reduce((n, f) => n + (f.chunks?.length ?? 0), 0)}.`;
  } catch {
    return "Could not parse the diff into files.";
  }
}

export function heuristicNote(diffText: string): NoteResult {
  const summary = summarizeDiff(diffText);
  const comments: FileComment[] = [];

  const files = (() => {
    try {
      return parseDiff(diffText);
    } catch {
      return [];
    }
  })();

  for (const file of files.slice(0, 8)) {
    const name = file.to || file.from || "unknown";
    const text = (file.chunks ?? [])
      .flatMap((c) => c.changes)
      .map((ch) => ("content" in ch ? ch.content : ""))
      .join("\n")
      .toLowerCase();

    if (text.includes("password") && text.includes("===")) {
      comments.push({
        file: name,
        tag: "bug",
        comment: "Plain equality check on a password field. Prefer a constant-time compare and never store plain passwords.",
      });
    } else if (text.includes("todo") || text.includes("fixme")) {
      comments.push({
        file: name,
        tag: "nit",
        comment: "Left a TODO or FIXME in the change.",
      });
    } else if (text.includes("console.log") || text.includes("debugger")) {
      comments.push({
        file: name,
        tag: "nit",
        comment: "Debug statement left in the diff.",
      });
    } else if (file.additions > 40) {
      comments.push({
        file: name,
        tag: "risk",
        comment: "Large addition. Consider splitting or adding tests.",
      });
    } else {
      comments.push({
        file: name,
        tag: "question",
        comment: "Review the change for edge cases and missing tests.",
      });
    }
  }

  if (comments.length === 0) {
    comments.push({
      file: "(diff)",
      tag: "question",
      comment: "Could not extract file-level notes from this paste. Check that it is a unified diff.",
    });
  }

  return {
    summary: `Offline notes. ${summary}`,
    comments,
    source: "heuristic",
    model: null,
  };
}
