import { Router } from "express";
import { reviewDiff } from "../ai/review.js";
import { noteRequestSchema } from "../ai/schema.js";
import type { AppEnv } from "../env.js";
import type { NoteStore } from "../types.js";

export function notesRouter(store: NoteStore, env: AppEnv) {
  const router = Router();

  router.get("/", async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 50);
    const notes = await store.list(limit);
    res.json({ notes });
  });

  router.get("/:id", async (req, res) => {
    const note = await store.get(req.params.id);
    if (!note) {
      res.status(404).json({ error: "Note not found." });
      return;
    }
    res.json({ note });
  });

  router.post("/", async (req, res) => {
    const parsed = noteRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Diff must be 40–30,000 characters." });
      return;
    }
    const result = await reviewDiff({
      diffText: parsed.data.diffText,
      apiKey: env.openAiKey,
      baseURL: env.openAiBaseUrl,
      model: env.model,
    });
    const note = await store.insert({
      title: parsed.data.title,
      diffText: parsed.data.diffText,
      result,
    });
    res.status(201).json({ note });
  });

  router.delete("/:id", async (req, res) => {
    const ok = await store.remove(req.params.id);
    if (!ok) {
      res.status(404).json({ error: "Note not found." });
      return;
    }
    res.status(204).end();
  });

  return router;
}
