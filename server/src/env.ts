import dotenv from "dotenv";

dotenv.config();

export type AppEnv = {
  port: number;
  mongoUri: string;
  openAiKey: string;
  openAiBaseUrl: string;
  model: string;
};

export function loadEnv(): AppEnv {
  return {
    port: Number(process.env.PORT ?? 4000),
    mongoUri: process.env.MONGO_URI ?? "",
    openAiKey: process.env.OPENAI_API_KEY ?? "",
    openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
}
