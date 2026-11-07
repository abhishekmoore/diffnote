import assert from "node:assert/strict";
import test from "node:test";
import { heuristicNote, summarizeDiff } from "./heuristic.js";
import { extractJson } from "./parse.js";
import { modelResultSchema } from "./schema.js";
import { formatCreatedAt } from "../dates.js";

const SAMPLE = `diff --git a/src/auth.ts b/src/auth.ts
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -1,3 +1,6 @@
 export function login(user, password) {
-  return db.find(user);
+  const found = db.find(user);
+  if (found && found.password === password) return found;
+  return null;
 }
`;

test("summarizeDiff uses parse-diff", () => {
  const summary = summarizeDiff(SAMPLE);
  assert.match(summary, /src\/auth\.ts/);
  assert.match(summary, /\+3/);
});

test("heuristicNote flags password equality as bug", () => {
  const result = heuristicNote(SAMPLE);
  assert.equal(result.source, "heuristic");
  assert.equal(result.model, null);
  const bug = result.comments.find((c) => c.tag === "bug");
  assert.ok(bug);
  assert.match(bug.comment, /password/i);
  assert.equal(bug.file, "src/auth.ts");
});

test("extractJson and schema accept a valid model reply", () => {
  const raw = '```json\n{"summary":"One issue.","comments":[{"file":"src/auth.ts","tag":"bug","comment":"Plain compare."}]}\n```';
  const json = extractJson(raw);
  const parsed = modelResultSchema.parse(json);
  assert.equal(parsed.comments[0].tag, "bug");
});

test("formatCreatedAt returns a non-empty string", () => {
  const formatted = formatCreatedAt(new Date("2026-11-07T10:00:00Z"));
  assert.ok(formatted.length > 8);
});
