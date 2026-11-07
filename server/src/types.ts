export type Tag = "bug" | "risk" | "question" | "nit";

export type FileComment = {
  file: string;
  tag: Tag;
  comment: string;
  line?: number;
};

export type NoteResult = {
  summary: string;
  comments: FileComment[];
  source: "model" | "heuristic";
  model: string | null;
};

export type NoteRecord = {
  id: string;
  title?: string;
  diffText: string;
  result: NoteResult;
  createdAt: string;
};

export type NoteStore = {
  insert(input: { title?: string; diffText: string; result: NoteResult }): Promise<NoteRecord>;
  list(limit: number): Promise<NoteRecord[]>;
  get(id: string): Promise<NoteRecord | null>;
  remove(id: string): Promise<boolean>;
};

export type HealthInfo = {
  ok: boolean;
  store: "memory" | "mongo";
  ai: "model" | "heuristic";
  model: string | null;
};
