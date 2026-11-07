# DiffNote

DiffNote reads a unified diff and returns file-level review notes tagged **bug**, **risk**, **question**, or **nit**.

It is a small TypeScript MERN app: React, Express, MongoDB, and an OpenAI-compatible model. If you do not set a model key, it still runs. The screen is labeled as offline notes, not as a model judgment.

This is a review **aid**. It does not replace a human reviewer.

## What you can do

- Paste a unified diff, or load the built-in sample.
- Get a one-sentence summary and file-level comments. The model does not rewrite the whole change.
- Save each review and reopen it later.
- Delete a review you do not want to keep.

The model is told to comment only on what is present in the paste. It must not invent file names or line numbers. The offline path uses `parse-diff` to walk files and hunks and applies simple pattern checks.

## Stack

| Piece | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite, Tailwind CSS |
| API | Express 4, TypeScript, Zod, helmet, cors |
| Data | MongoDB via Mongoose, or an in-memory store |
| Model | `openai` SDK against any compatible base URL |
| Client data | axios, TanStack Query |
| Dates | date-fns |
| Diff parse | parse-diff |
| Tests | `node:test` through `tsx` |

## Run it

Node 20 or newer.

```bash
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL printed in the terminal (port 5173). The API is on port 4000. Vite proxies `/api` to it.

Production-style, one process:

```bash
npm run build
npm start
```

Then open port 4000. Express serves the built React app.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port. Default `4000`. |
| `MONGO_URI` | No | Example: `mongodb://127.0.0.1:27017/diffnote`. If empty, notes live in memory and vanish when the process stops. |
| `OPENAI_API_KEY` | No | If empty, DiffNote uses the offline notes. |
| `OPENAI_BASE_URL` | No | Use this for xAI, Groq, OpenRouter, or a local server. |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini`. |

Do not commit `.env`.

## API

`GET /api/health` — `{ ok, store: "memory" | "mongo", ai: "model" | "heuristic", model }`

`GET /api/notes?limit=20` — newest first, limit 1–50.

`POST /api/notes` — body `{ diffText, title? }`. `diffText` must be 40–30,000 characters. Returns the saved note.

`GET /api/notes/:id`

`DELETE /api/notes/:id` — `204` when removed.

## Scripts

```bash
npm test
npm run typecheck
npm run build
```

GitHub Actions runs those three on every push.

## Limits

- The offline notes are pattern checks (password equality, TODO, debug statements, large additions). They miss most real review issues.
- The model can still be wrong. Read the diff yourself before you trust a comment.
- There is no login. Anyone who can reach the server can read saved diffs. Do not point this at the public internet with private code.

Design notes for someone changing the code are in [DEVELOPER.md](DEVELOPER.md).
