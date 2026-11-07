import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryStore } from "./memory.js";
import { heuristicNote } from "../ai/heuristic.js";

test("memory store insert list get remove", async () => {
  const store = createMemoryStore();
  const result = heuristicNote("diff --git a/a.ts b/a.ts\n+++ b/a.ts\n@@\n+const x = 1;\n");
  const inserted = await store.insert({ diffText: "diff --git a/a.ts b/a.ts\n", result, title: "t" });
  assert.ok(inserted.id);
  assert.equal(inserted.title, "t");

  const list = await store.list(10);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, inserted.id);

  const got = await store.get(inserted.id);
  assert.ok(got);
  assert.equal(got.result.source, "heuristic");

  const removed = await store.remove(inserted.id);
  assert.equal(removed, true);
  assert.equal(await store.get(inserted.id), null);
});
