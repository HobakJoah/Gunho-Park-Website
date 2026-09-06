# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working conventions

Ask for explicit permission before executing anything — running commands, installing packages,
editing/creating files, etc. Lay out the plan first and wait for a go-ahead rather than acting on
it immediately.

## Commands

```bash
npm run dev      # Vite dev server with HMR (frontend only — does not serve /api)
npm run build    # production build to dist/
npm run preview  # serve the built dist/
npm run lint     # eslint over the repo
vercel dev       # frontend + /api/chat together; needs .env with GEMINI_API_KEY (see .env.example)
```

No test framework is configured.

## Architecture

React 19 + Vite SPA with a small Vercel serverless backend. Bot replies come from the Gemini API via
a proxy function at `api/chat.js`, not from a canned local engine — the function loads `about-me.md`
at cold start and injects it as a system instruction so the bot answers only questions about the site
owner, in first person, and declines anything else. `vercel.json` marks `about-me.md` as a file the
function needs bundled (`includeFiles`), since it's read from disk at runtime rather than imported.

State lives entirely in `App.jsx` as one `chatMessages` array and is passed down; there is no
context or store. Message objects are `{ message, sender: 'user' | 'robot', id }` where `id` is a
`crypto.randomUUID()`.

Component roles:
- `App.jsx` — owns `chatMessages`; renders the welcome text when the array is empty.
- `components/ChatInput.jsx` — owns the input text and `isLoading`. `sendMessage` appends the user
  message, then immediately replaces the array with one containing a placeholder robot message whose
  `message` is a **JSX `<img>` spinner**, then POSTs `{ message, history }` to `/api/chat` — `history`
  is built from prior string-only messages mapped to Gemini's `{ role, parts }` shape — and replaces
  the placeholder with the reply (or a fallback string on error). Because it rebuilds from the local
  `newChatMessages` snapshot rather than using an updater function, `isLoading` guards against
  overlapping sends.
- `api/chat.js` — Vercel serverless function; the only place `GEMINI_API_KEY` is read. Rate-limits by
  IP (in-memory, resets per cold start — a soft deterrent, not a hard guarantee across concurrent
  instances) before validating the incoming message (non-empty, ≤2000 chars), then forwards `history`
  + the new message to `gemini-3.6-flash` (capped at `maxOutputTokens`, with a system-instruction hint
  to keep answers brief) and returns `{ reply }` (or `{ error }` with a 4xx/5xx status).
- `components/ChatMessages.jsx` — maps the array to `ChatMessage`, and defines the local
  `useAutoScroll` hook that pins the container to `scrollHeight` on change.
- `components/ChatMessage.jsx` — picks the user/robot layout and profile image. The timestamp is
  computed with `dayjs()` at render time, so it is *not* the send time and shifts on re-render; if
  the time needs to be real, store it on the message object at creation.

A consequence to keep in mind when touching message state: `message` may hold JSX, not just a string
(the loading spinner), so anything that serializes or measures messages must handle that. `App.jsx`
persists `chatMessages` to `localStorage` under the key `messages` on every change and restores it as
the initial state via `loadStoredMessages`, which filters to string-only messages — so a stale spinner
placeholder from a tab closed mid-request is dropped rather than coming back as a broken `{}`.

## Conventions

Styling is plain CSS, one `.css` file per component, imported by that component. Assets are imported
as ES modules from `src/assets/` (never referenced by literal path).

ESLint config note: `no-unused-vars` ignores identifiers matching `^[A-Z_]`, and `react/prop-types`
is off — components take destructured props with no validation.
