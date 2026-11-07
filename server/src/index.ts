import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";
import { connectStore } from "./db/connect.js";
import { loadEnv } from "./env.js";

const env = loadEnv();

const { store, kind } = await connectStore(env);
const app = createApp(store, env, kind);

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(env.port, () => {
  console.log(`DiffNote listening on http://127.0.0.1:${env.port} (store=${kind}, ai=${env.openAiKey ? "model" : "heuristic"})`);
});
