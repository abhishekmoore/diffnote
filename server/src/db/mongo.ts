import mongoose from "mongoose";
import type { NoteRecord, NoteResult, NoteStore } from "../types.js";

const NoteModel = mongoose.model(
  "Note",
  new mongoose.Schema(
    {
      title: String,
      diffText: { type: String, required: true },
      result: { type: mongoose.Schema.Types.Mixed, required: true },
      createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false },
  ),
);

function toRecord(doc: {
  _id: mongoose.Types.ObjectId;
  title?: string | null;
  diffText: string;
  result: NoteResult;
  createdAt: Date;
}): NoteRecord {
  return {
    id: doc._id.toHexString(),
    title: doc.title ?? undefined,
    diffText: doc.diffText,
    result: doc.result,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function createMongoStore(): NoteStore {
  return {
    async insert(input) {
      const doc = await NoteModel.create({
        title: input.title,
        diffText: input.diffText,
        result: input.result,
      });
      return toRecord(doc);
    },
    async list(limit) {
      const docs = await NoteModel.find().sort({ createdAt: -1 }).limit(limit);
      return docs.map(toRecord);
    },
    async get(id) {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await NoteModel.findById(id);
      return doc ? toRecord(doc) : null;
    },
    async remove(id) {
      if (!mongoose.isValidObjectId(id)) return false;
      const res = await NoteModel.findByIdAndDelete(id);
      return Boolean(res);
    },
  };
}
