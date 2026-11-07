import type { AppEnv } from "../env.js";
import type { NoteStore } from "../types.js";
import { createMemoryStore } from "./memory.js";
import { createMongoStore } from "./mongo.js";
import mongoose from "mongoose";

export async function connectStore(env: AppEnv): Promise<{ store: NoteStore; kind: "memory" | "mongo" }> {
  if (!env.mongoUri) {
    return { store: createMemoryStore(), kind: "memory" };
  }
  await mongoose.connect(env.mongoUri);
  return { store: createMongoStore(), kind: "mongo" };
}
