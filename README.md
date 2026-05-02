# BrihanMumbai Fix

AI-powered civic issue reporting platform for Mumbai citizens. Report potholes, garbage, water leaks, broken streetlights, and more — and track resolution in real time.

## Features

- **AI Image Analysis** — Upload a photo and Gemini/Groq AI automatically classifies the issue type, severity, and responsible department.
- **Geo-tagged Reports** — Capture GPS coordinates or type an address; reverse-geocoded via OpenStreetMap.
- **Formal Complaint Letter** — Groq LLM generates a formal BMC complaint letter on submission.
- **Real-time Dashboard** — Citizens track the status of their own complaints.
- **Community Feed** — Browse all reported issues across wards.
- **Admin Portal** — MCGM officials can view, filter, and update complaint statuses.
- **Secure Auth** — JWT-based auth with httpOnly cookies; Next.js proxy middleware protects all routes.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Flask, PyMongo (MongoDB Atlas), bcrypt, PyJWT, Flask-CORS |
| AI | Google Gemini (image vision) with Groq LLaMA fallback |
| Storage | Cloudinary (image hosting) |
| Deployment | Vercel (frontend) · Render (backend) |

## Project Structure

```
brihanmumbai-fix/
├── frontend/          # Next.js 16 App Router app
│   ├── app/           # Pages (login, register, dashboard, report, feed, admin)
│   ├── components/    # shadcn/Radix UI primitives + landing section components
│   ├── lib/           # api.ts (fetch wrapper) · auth.ts (session helpers)
│   └── proxy.ts       # Next.js middleware — JWT-verified route protection
└── backend/
    ├── app.py         # Flask monolith (auth, complaints, AI, feed, admin)
    ├── create_admin.py# CLI script to seed an admin user
    └── requirements.txt
```

## Local Development

### Prerequisites

- Node.js ≥ 20, pnpm
- Python ≥ 3.11
- MongoDB Atlas URI (or local MongoDB)
- Cloudinary account
- Google Gemini API key and/or Groq API key

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
python app.py
```

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local   # fill in JWT_SECRET + NEXT_PUBLIC_API_URL
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Create an Admin User

```bash
cd backend
python create_admin.py
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | ≥ 32 chars; must match frontend |
| `GEMINI_API_KEY` | | Google Gemini vision key |
| `GROQ_API_KEY` | | Groq API key (vision + text fallback) |
| `CLOUDINARY_CLOUD_NAME` | | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | | Cloudinary API secret |
| `FRONTEND_URL` | | Allowed CORS origin (defaults to `http://localhost:3000`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Must match backend `JWT_SECRET` |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL (e.g. `https://your-api.onrender.com`) |

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full Render + Vercel instructions.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design, auth flow, data models
- [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md) — Component hierarchy, routing, state
- [AI_PROJECT_CONTEXT.md](AI_PROJECT_CONTEXT.md) — Detailed handoff notes for AI/engineers

