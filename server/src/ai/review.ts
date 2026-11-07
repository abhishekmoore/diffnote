import OpenAI from "openai";
import { heuristicNote, summarizeDiff } from "./heuristic.js";
import { extractJson } from "./parse.js";
import { modelResultSchema } from "./schema.js";
import type { NoteResult } from "../types.js";

const SYSTEM = `You write file-level review notes on a unified diff.
Return JSON only with keys: summary (one sentence), comments (array of {file, tag, comment, line?}).
tag must be one of: bug, risk, question, nit.
Rules:
- Comment only on what is present in the diff. Never invent file names, line numbers, or behaviors that are not shown.
- Prefer a short comment over a rewrite of the whole change.
- line is optional and only when the hunk shows that number.
- Keep at most 12 comments.`;

export async function reviewDiff(input: {
  diffText: string;
  apiKey: string;
  baseURL: string;
  model: string;
}): Promise<NoteResult> {
  if (!input.apiKey) {
    return heuristicNote(input.diffText);
  }
  try {
    return await fromModel(input);
  } catch (error) {
    const fallback = heuristicNote(input.diffText);
    const message = error instanceof Error ? error.message : "model request failed";
    return {
      ...fallback,
      summary: `Model request failed (${clip(message)}). Showing offline notes instead. ${fallback.summary}`,
    };
  }
}

async function fromModel(input: {
  diffText: string;
  apiKey: string;
  baseURL: string;
  model: string;
}): Promise<NoteResult> {
  const client = new OpenAI({
    apiKey: input.apiKey,
    baseURL: input.baseURL || undefined,
  });
  const summary = summarizeDiff(input.diffText);
  const user = `DIFF SUMMARY (from parse-diff):\n${summary}\n\nORIGINAL DIFF:\n${input.diffText}`;
  let raw = await complete(client, input.model, user, true);
  let parsed = readModel(raw);
  if (!parsed.ok) {
    raw = await complete(
      client,
      input.model,
      `${user}\n\nThe previous reply was invalid (${parsed.reason}). Reply with one JSON object only.`,
      false,
    );
    parsed = readModel(raw);
  }
  if (!parsed.ok) {
    throw new Error(parsed.reason);
  }

  return {
    summary: parsed.value.summary,
    comments: parsed.value.comments,
    source: "model",
    model: input.model,
  };
}

function readModel(raw: string): { ok: true; value: ReturnType<typeof modelResultSchema.parse> } | { ok: false; reason: string } {
  try {
    const json = extractJson(raw);
    const value = modelResultSchema.parse(json);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? clip(error.message) : "invalid model JSON" };
  }
}

async function complete(client: OpenAI, model: string, user: string, jsonMode: boolean): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });
    return response.choices[0]?.message?.content ?? "";
  } catch (error) {
    if (!jsonMode) throw error;
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  }
}

function clip(message: string): string {
  return message.replace(/\s+/g, " ").slice(0, 180);
}
