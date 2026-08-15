# url = https://taskflow-vert-chi.vercel.app/
# TaskFlow

A small Trello-style task board. React (Vite) frontend, Node/Express backend, SQLite database.

```
taskflow/
├── backend/     Express API + SQLite database
├── frontend/    React (Vite) UI
└── docker-compose.yml
```

## Quick start (plain npm)

You'll need Node.js 18+ installed. Two terminals, run from a fresh clone:

**1. Backend**

```bash
cd backend
npm install
npm run seed     # creates taskflow.db and fills it with sample data
npm run dev       # starts the API on http://localhost:4000
```

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env   # points the app at http://localhost:4000/api
npm run dev             # starts the UI on http://localhost:5173
```

Open http://localhost:5173 — you should see a "Product Launch" board with three columns and seeded tasks.

## Quick start (Docker)

```bash
docker compose up --build
```

Backend on http://localhost:4000, frontend on http://localhost:5173. The backend image seeds the database on build, so the first run already has data.

## Running the backend tests

```bash
cd backend
npm test
```

This runs 6 tests against an isolated SQLite file (`tests/test.db`, wiped and reseeded per test — never touches your real `taskflow.db`):
- creating a task with no title fails (both a blank string and a missing field)
- creating a task with a valid title succeeds
- moving a task updates its `column_id` (its "status") — checked via the API response and a direct row read
- moving a task to a nonexistent column is rejected
- **database layer**: `getTaskCountsPerColumn` returns correct counts, including a column with zero tasks
- **database layer**: `getTasksByPriority` returns rows newest-first for a given priority

## Database

Schema lives in [`backend/src/db/schema.sql`](backend/src/db/schema.sql) — three tables (`boards`, `columns`, `tasks`), each with a primary key, a foreign key down the hierarchy (`ON DELETE CASCADE`), `NOT NULL`/`CHECK` constraints on required fields (title can't be blank, priority must be one of Low/Medium/High), and indexes on the foreign key columns plus `priority`.

The two required non-trivial queries are in [`backend/src/db/queries.js`](backend/src/db/queries.js):
- `getTaskCountsPerColumn` — `LEFT JOIN` + `GROUP BY` so a column with no tasks still shows `0`, computed in SQL rather than fetched-then-counted in JS. Exposed at `GET /api/boards/:id/task-counts`.
- `getTasksByPriority` — joins `tasks` to `columns` to scope by board, filters by priority, and orders by `created_at DESC`. Exposed at `GET /api/boards/:id/tasks?priority=High`.

Seed data: [`backend/src/db/seed.js`](backend/src/db/seed.js) — one board, three columns, seven tasks across varied priorities and dates. Re-running `npm run seed` wipes and reseeds cleanly.

## API summary

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/boards/:id` | Board with its columns and tasks |
| GET | `/api/boards/:id/task-counts` | Task count per column (query #1) |
| GET | `/api/boards/:id/tasks?priority=High` | Tasks by priority, newest first (query #2) |
| POST | `/api/tasks` | Create a task (`columnId`, `title`, `description?`, `priority?`) |
| PATCH | `/api/tasks/:id` | Edit title/description/priority |
| PATCH | `/api/tasks/:id/move` | Move a task to a different column (`columnId`) |
| DELETE | `/api/tasks/:id` | Delete a task |

Empty/whitespace-only titles are rejected with a `400` on the backend regardless of what the frontend sends.

## Assumptions & decisions

- **Single board, hardcoded ID.** Multiple boards were explicitly out of scope, so the frontend always loads board `1` rather than building board switching UI that would go unused.
- **Move via dropdown, not drag-and-drop for the "must-have" — but I did both.** The task card has a column `<select>` (the reliable fallback called out in the brief), and columns also accept a native HTML5 drag-and-drop drop from a card, wired to the same `moveTask` handler. If the drag interaction ever misbehaves in your browser, the dropdown is the guaranteed path.
- **Priority defaults to Medium** when not specified on creation, since the brief marks it optional but the schema needed *some* value to satisfy `NOT NULL`.
- **Optimistic move updates.** Moving a task updates the UI immediately and rolls back (via a refetch) if the request fails, so drag/dropdown moves don't feel laggy.
- **Search implemented** (the nice-to-have) alongside the required priority filter, since both are simple client-side filters over already-fetched data — no extra endpoint needed.
- **No pagination/virtualization** on the board — reasonable for a small team's task list, and out of scope per the brief's "not a design evaluation" note.

## What I'd improve with more time

- Real drag-and-drop reordering *within* a column (currently tasks are ordered by `created_at`; there's no manual re-sort).
- Debounce the search input and add an empty-state illustration/message distinct from "no tasks" vs "no matches."
- Move the single hardcoded `BOARD_ID` into a board picker, even if there's only ever one board seeded, so the API's board-scoping isn't dead code.
- Add frontend component tests (React Testing Library) — right now only the backend is tested, per the brief's minimum bar.
- Deploy it (Render for the backend, static hosting for the frontend) for a live link.

## Time spent

Roughly 4–5 hours end to end: schema and queries first, then the API and its tests, then the React UI.

## Something I looked up

I double-checked how `better-sqlite3` handles concurrent writes since it's synchronous by design — it turns out that's actually a deliberate trade-off: because every call blocks until SQLite finishes, there's no risk of the classic "two async writes race and corrupt state" bug you can hit with callback- or promise-based SQLite drivers under load. For a small team task board, that simplicity was worth more than async I/O would have bought us.
