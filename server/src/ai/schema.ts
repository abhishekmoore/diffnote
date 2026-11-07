import { z } from "zod";

export const tagSchema = z.enum(["bug", "risk", "question", "nit"]);

export const fileCommentSchema = z.object({
  file: z.string().trim().min(1).max(300),
  tag: tagSchema,
  comment: z.string().trim().min(1).max(800),
  line: z.number().int().positive().optional(),
});

export const modelResultSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  comments: z.array(fileCommentSchema).max(30),
});

export type ModelResult = z.infer<typeof modelResultSchema>;

export const noteRequestSchema = z.object({
  diffText: z.string().trim().min(40).max(30000),
  title: z.string().trim().max(120).optional(),
});
