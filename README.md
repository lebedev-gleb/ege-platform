# ЕГЭ.Информатика — EGE prep platform

Full-stack web platform for preparing for the Russian Unified State Exam (EGE) in Computer Science: courses with theory, a task bank with automatic answer checking, hints and solutions, timed quizzes, full exam variants, progress tracking and an admin course builder.

## Tech stack

| Part | Technologies |
|---|---|
| Frontend | Next.js 16 (App Router, server components), React 19, TypeScript, Tailwind CSS 4, Zustand |
| Backend | Go, Fiber v2, PostgreSQL (pgx), goose migrations |
| Auth | Sign in with Yandex ID (OAuth 2.0), JWT sessions |

## Features

- Course catalog: sections, theory with images, tasks by difficulty
- Automatic answer checking, hints and step-by-step solutions
- Mistake review mode
- Timed quizzes and full exam variants with attempt history
- Personal progress, statistics and a daily activity streak
- Admin panel: course builder, task editor with attachments, author variants and quizzes
- Light and dark themes

## Architecture

```
ege-platform/   Next.js frontend — server components fetch data from the API
ege-backend/    Go REST API (~45 endpoints)
  handlers/     auth, tasks, quizzes, variants, progress, admin
  models/       data models
  db/           connection pool + 16 SQL migrations, applied automatically on startup
```

## Running locally

**Backend** — create `ege-backend/.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | secret for signing JWT tokens |
| `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET` | Yandex ID OAuth app credentials |
| `ADMIN_USER_IDS` | comma-separated user IDs with admin access |
| `PORT` | API port |

```bash
cd ege-backend
go run .
```

**Frontend** — create `ege-platform/.env.local` with `NEXT_PUBLIC_API_URL` (API address) and `NEXT_PUBLIC_YANDEX_CLIENT_ID`:

```bash
cd ege-platform
npm install
npm run dev
```
