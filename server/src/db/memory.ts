import { randomUUID } from "node:crypto";
import type { NoteRecord, NoteStore } from "../types.js";

export function createMemoryStore(): NoteStore {
  const rows: NoteRecord[] = [];

  return {
    async insert(input) {
      const record: NoteRecord = {
        id: randomUUID(),
        title: input.title,
        diffText: input.diffText,
        result: input.result,
        createdAt: new Date().toISOString(),
      };
      rows.unshift(record);
      return record;
    },
    async list(limit) {
      return rows.slice(0, limit);
    },
    async get(id) {
      return rows.find((r) => r.id === id) ?? null;
    },
    async remove(id) {
      const index = rows.findIndex((r) => r.id === id);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}
