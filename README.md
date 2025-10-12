<!-- Root README for ChatterBox -->
# ChatterBox

ChatterBox is a Next.js (App Router) chat application scaffold originally started from a Firebase starter and migrated to use MongoDB Atlas + server-side APIs for authentication and messaging.

This repository contains the frontend (Next.js app) and server API endpoints (Next.js API routes) that talk to MongoDB Atlas. The project keeps a lightweight Realm Web SDK as an optional runtime fallback, but server APIs are the primary data/auth path.

        <p align="center">
  <a href="https://jarvisai-f42y.onrender.com//">
    <img src="https://img.shields.io/badge/View Demo-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"/>
  </a>
</p>

## Quick links

- Source: `src/` — main app code, components, and helpers
- APIs: `src/pages/api/` — auth, users, messages endpoints
- Docs: `docs/` — project documentation and blueprints

## Prerequisites

- Node.js 18+ (recommended)
- npm or pnpm
- A MongoDB Atlas connection string with access to a database

## Required environment variables

Create a `.env.local` file in the project root (do not commit secrets). The project expects at least:

- `MONGODB_URI` — MongoDB connection string (required)
- `MONGODB_DB` — database name (optional, default used in code if present)
- `JWT_SECRET` — secret used to sign JWTs for auth (required)

Optional environment variables used by features in the repo:

- `NEXT_PUBLIC_REALM_APP_ID` — Realm App ID if you want to enable runtime Realm fallback
- `GEMINI_API_KEY` / `GOOGLE_API_KEY` — required by genkit / AI integrations. If these are missing the server may build but `next start` can fail when AI plugins initialize.

There's a `.env.local.example` in the repo demonstrating the keys (copy it to `.env.local` and fill values).

## Install and run (development)

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build / Production

```bash
npm run build
npm run start
```

Note: If you see an error about missing AI keys when starting the production server, either set `GEMINI_API_KEY` / `GOOGLE_API_KEY` or temporarily disable the AI/Genkit integrations.

## Important APIs

The project exposes several API routes (Next.js pages/api) used by the client:

- `POST /api/auth/signup` — create an account (email, username, password)
- `POST /api/auth/login` — authenticate and receive a JWT
- `GET /api/users` — list or search users
- `GET /api/messages?conversationId=...` — fetch messages for a conversation
- `POST /api/messages` — create a message and update conversation metadata

These endpoints use the MongoDB helper in `src/lib/mongodb.ts`.

## Developer notes & known caveats

- Real-time updates currently use polling (short interval). If you need instant message push, consider WebSockets or Server-Sent Events.
- The repo contains a lightweight Realm Web SDK usage as a client-side fallback. Atlas App Services Device Sync has reached EOL for some users; prefer the server APIs.
- If `next start` fails with a message about passing an API key for genkit/google-genai, set the corresponding env vars or remove/guard the initialization in `src/ai/*` until keys are available.
- The `Add to contact` button in the chat user list is implemented in the UI; if it doesn't persist contacts, check `src/components/chat/user-list.tsx` and the `chat-layout` parent wiring.

## Contributing

Follow standard GitHub workflows. The current feature branch with MongoDB/auth work is `feat/mongodb-auth`.

## Where to look

- UI entry: `src/app/page.tsx` and `src/app/chat/page.tsx`
- Chat UI & logic: `src/components/chat/` — `chat.tsx`, `chat-layout.tsx`, `user-list.tsx`
- Server helpers: `src/lib/mongodb.ts`, `src/lib/firebase.ts` (legacy), `src/lib/realm.ts` (fallback)
- API: `src/pages/api/`

---
If you want, I can also add a short `CONTRIBUTING.md`, API examples, or a Postman collection for the API endpoints.
