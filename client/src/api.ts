import axios from "axios";
import type { HealthInfo, NoteRecord } from "./types";

const client = axios.create({ baseURL: "/api" });

export async function fetchHealth(): Promise<HealthInfo> {
  const { data } = await client.get<HealthInfo>("/health");
  return data;
}

export async function fetchNotes(): Promise<NoteRecord[]> {
  const { data } = await client.get<{ notes: NoteRecord[] }>("/notes");
  return data.notes;
}

export async function createNote(body: { diffText: string; title?: string }): Promise<NoteRecord> {
  const { data } = await client.post<{ note: NoteRecord }>("/notes", body);
  return data.note;
}

export async function deleteNote(id: string): Promise<void> {
  await client.delete(`/notes/${id}`);
}
