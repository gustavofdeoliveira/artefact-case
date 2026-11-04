# artefact

A simple task manager built for **Part 2 – Practical Challenge** of the case. The backend exposes a task CRUD over **tRPC** and keeps everything in memory. The frontend is a **Next.js 15** app that consumes that backend.

## Structure

```
.
├── backend/
│   ├── Dockerfile
│   ├── .env.example        # variables for running without Docker
│   └── src/
│       ├── index.ts        # HTTP server (tRPC standalone adapter) + CORS
│       ├── trpc.ts         # tRPC init and error formatting
│       ├── router.ts       # procedures task.list/byId/create/update/delete
│       ├── task.ts         # model and Zod schemas
│       ├── store.ts        # in-memory repository (Map) + cursor pagination
│       └── seed.ts         # fictitious tasks to showcase infinite scroll
├── frontend/
│   ├── .env.example        # backend address (NEXT_PUBLIC_API_URL)
│   └── src/
│       ├── app/            # routes: / , /tasks/new , /tasks/[id]/edit
│       ├── components/     # TaskList (infinite scroll), TaskForm, Notice
│       ├── trpc/           # tRPC clients (server/SSR and React hooks) and types
│       └── lib/config.ts
├── docker-compose.yml      # runs the backend
└── README.md
```

---

## Functional requirements

| ID | Requirement |
|------|-------------|
| FR01 | **Create a task** with `titulo` (required) and `descricao` (optional). The server generates `id` and `dataCriacao`. |
| FR02 | **List tasks** with cursor pagination, newest first. |
| FR03 | **Update** an existing task (title and description). |
| FR04 | **Delete** an existing task. |
| FR05 | **Backend validation**: reject tasks without a title (or with a whitespace-only title). |
| FR06 | **Meaningful errors**: acting on a missing `id` returns `NOT_FOUND` with a clear message; invalid input returns `BAD_REQUEST`. |
| FR07 | **List page** with the first page preloaded through **SSR**. |
| FR08 | **Delete straight from the list**, with visual success/error feedback. |
| FR09 | **Create/edit page** with a form built from function components and hooks. |
| FR10 | **Form validation**: block submission when the title is empty. |
| FR11 | **State feedback**: loading, success and failure, for errors coming from both backend and frontend. |
| FR12 | *(Bonus)* **Infinite scroll**: the list loads incrementally as the user scrolls. |

## Non-functional requirements

| ID | Requirement |
|-------|-------------|
| NFR01 | **Stack**: TypeScript everywhere, Next.js 15 (App Router) and tRPC as transport. |
| NFR02 | **End-to-end type safety**: the frontend uses the backend router's type, with no hand-written duplicated contract. |
| NFR03 | **Declarative input validation** with Zod, producing standard tRPC errors. |
| NFR04 | **In-memory storage**: no database; data is lost when the process restarts (expected behavior). |
| NFR05 | **Containerized backend** with Docker, started with a single command. |
| NFR06 | **Configuration via environment variables**, with versioned `.env.example` files and no versioned secrets. |
| NFR07 | **Simplicity**: few dependencies and a functional layout, no elaborate design. |
| NFR08 | **Documentation**: comments on the main decisions and this README. |
| NFR09 | **Public repository**: no sensitive information; all data is fictitious. |

---

## Out of scope and constraints

The scope was limited on purpose. Below is what was left out and how it would be handled in a real scenario.

| Topic | In this project | In production |
|-------|-----------------|---------------|
| **Authentication/Authorization (JWT, sessions)** | None. Every tRPC procedure is public: any client can create, edit or delete. | Login (e.g. Auth.js/OAuth) with short-lived JWTs and a refresh token in an `httpOnly` cookie. A `protectedProcedure` would validate the token in the tRPC `context`, and tasks would be scoped per user. |
| **Database / persistence** | An in-memory `Map`. Data is lost on every restart and is not shared between replicas, which prevents horizontal scaling. | PostgreSQL with an ORM (Prisma/Drizzle), migrations and an index backing cursor pagination. |
| **Multi-user / concurrency** | No concurrent edit control: last write wins. | Optimistic locking (`version`/`updatedAt` field) with conflicts returned as `CONFLICT`. |
| **Rate limiting / abuse protection** | Not implemented. | Rate limiting per IP/user (gateway or middleware) plus payload size limits. |
| **CORS / HTTPS** | CORS allows a single origin (the local frontend); plain HTTP in development. | HTTPS terminated at a reverse proxy and CORS restricted to official domains. |
| **Observability** | Console logs only. | Structured logs, tracing (OpenTelemetry), metrics and alerts. |
| **Automated tests** | No versioned test suite; the app was validated with a manual end-to-end script (see [Validation](#validation)). | Unit tests for the tRPC procedures (`createCaller`), component tests and e2e (Playwright) in CI. |
| **CI/CD and deploy** | Not configured. | Pipeline with lint, typecheck, tests and image build, plus automated deploy. |
| **Frontend in Docker** | Not containerized on purpose; it runs locally with `npm run dev`. | Image built with Next.js `output: "standalone"`, if needed. |
| **Accessibility / i18n** | Basic: semantic HTML, `aria-*` on fields and notices; English-only UI. | Accessibility audit and internationalization. |
| **Extra features** (done status, priority, search, filters) | Out of the minimum scope. | Natural evolutions of the `Task` model. |

---

## How to run

### Prerequisites

- **Docker** + **Docker Compose** (backend)
- **Node.js 20+** and **npm** (frontend)

### 1. Backend (Docker)

From the repository root:

```bash
docker compose up --build
```

The tRPC server is available at `http://localhost:4000`. Stop it with `docker compose down`.

On startup the backend creates 25 fictitious tasks so infinite scroll is visible. To start with an empty list, set `SEED: "false"` in `docker-compose.yml`.

<details>
<summary>Running the backend without Docker</summary>

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
</details>

### 2. Frontend (local)

In another terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment variables

| Where | Variable | Default | Purpose |
|-------|----------|---------|---------|
| frontend | `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend address, used by SSR and by the browser. |
| backend | `PORT` | `4000` | HTTP port. |
| backend | `CORS_ORIGIN` | `http://localhost:3000` | Frontend origin allowed to call the API. |
| backend | `SEED` | `true` | Creates sample tasks on startup. |

> If port 3000 is busy, Next.js starts on 3001. In that case set `CORS_ORIGIN=http://localhost:3001` in the backend (in `docker-compose.yml` or `backend/.env`), otherwise the browser blocks the requests.

---

## Technical decisions

| Decision | Reason |
|----------|--------|
| **Standalone tRPC backend** (`@trpc/server/adapters/standalone`), no Express | An extra HTTP framework adds nothing to an in-memory CRUD. Keeping the backend out of Next.js lets it run isolated in Docker. |
| **Frontend imports only the `AppRouter` type** (`import type` from `../backend/src/router`) | End-to-end type safety without publishing a package or setting up a monorepo. The `paths` in `frontend/tsconfig.json` resolve `@trpc/server` and `zod` to the frontend's own packages, so nothing needs to be installed in `backend/`. |
| **Cursor pagination** (`dataCriacao` + `id`) instead of offset | With offset, deleting a task already on screen shifts the next pages and makes an item "disappear". The cursor stores the last item's key; `id` breaks ties between tasks created in the same millisecond. |
| **SSR + infinite scroll** | The Server Component fetches page 1 and passes it as `initialData` to `useInfiniteQuery`. Later pages are fetched on the client when an `IntersectionObserver` sentinel becomes visible. |
| **`dataCriacao` as a number (epoch ms)** | Travels through JSON losslessly, so no transformer (superjson) is needed. |
| **Update with PUT semantics** | The edit form sends the whole task, avoiding ambiguity between "field omitted" and "field cleared". |
| **Validation on both sides** | Zod on the backend is the source of truth. The form validates before submitting for immediate feedback, and the `errorFormatter` turns Zod errors into readable messages. |
| **English code and UI** | Model fields (`titulo`, `descricao`, `dataCriacao`) keep the names required by the case. |

## API (tRPC)

| Procedure | Type | Input | Errors |
|-----------|------|-------|--------|
| `task.list` | query | `{ limit?: 1-50 (default 10), cursor? }` → `{ items, nextCursor }` | `BAD_REQUEST` |
| `task.byId` | query | `{ id }` | `NOT_FOUND`, `BAD_REQUEST` |
| `task.create` | mutation | `{ titulo, descricao? }` | `BAD_REQUEST` (empty/too long title) |
| `task.update` | mutation | `{ id, titulo, descricao? }` | `NOT_FOUND`, `BAD_REQUEST` |
| `task.delete` | mutation | `{ id }` | `NOT_FOUND`, `BAD_REQUEST` |

---

## Validation

The application was checked end to end in a headless Chrome (Playwright script, not versioned) against the running backend and frontend. All checks passed:

| Requirement | Scenario |
|-------------|----------|
| FR07 | Raw HTML (no JavaScript) already contains the first 10 tasks. |
| FR02, FR12 | Scrolling loads pages 2 and 3 (25 tasks) and shows the end-of-list message. |
| FR04, FR08 | Deleting from the list removes the task and shows a success notice. |
| FR08, FR11 | Deleting a task already removed on the server shows the backend's `NOT_FOUND` message. |
| FR10 | Empty or whitespace-only title blocks submission with no request sent. |
| FR11 | While saving, the button shows "Saving..." and is disabled. |
| FR01 | Creating redirects to the list with a success notice; the new task is first. |
| FR03, FR09 | The edit form is pre-filled; saving shows the new title and a success notice. |
| FR06 | Saving a task deleted meanwhile shows `NOT_FOUND` in the form; a missing or malformed id shows the not-found page. |
| FR05 | The backend rejects an empty title with `BAD_REQUEST` regardless of the frontend. |
| — | No console or hydration errors. |
