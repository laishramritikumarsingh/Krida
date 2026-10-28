# KRIDA AI — Production Deployment & Infrastructure Guide

This guide covers production deployment strategies for **KRIDA AI** across modern cloud platforms (Vercel, Netlify, Render, Railway, and Docker).

---

## 1. Architecture & Platform Overview

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide icons.
  - Recommended Hosts: **Vercel** or **Netlify**
  - Production Build Output: `frontend/dist`
  - SPA Routing: Handled via `_redirects` / `vercel.json` rewrite rules.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Uvicorn, Pydantic v2.
  - Recommended Hosts: **Render**, **Railway**, or **Fly.io**
  - Database: **PostgreSQL** (Production) or **SQLite** (Local / Dev)
- **AI & RAG Engine**:
  - Live AI Provider: Google Gemini API (`GEMINI_API_KEY`) or OpenAI (`OPENAI_API_KEY`)
  - Zero-Key Fallback: Built-in deterministic Sports Science Recommendation Engine with full RAG knowledge retrieval and Indian food database with IFCT/USDA provenance.

---

## 2. Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy Database Connection URI | `sqlite:///./krida.db` or `postgresql://user:pass@host:5432/kridadb` |
| `SECRET_KEY` | Secret key for signing JWT bearer tokens | Any random 64-character hex string |
| `ALGORITHM` | JWT hashing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration duration in minutes | `1440` (24 hours) |
| `GEMINI_API_KEY` | Optional Google Gemini API key for live LLM | `AIzaSy...` (or leave blank for local sports engine) |
| `OPENAI_API_KEY` | Optional OpenAI API key | `sk-...` |
| `AI_PROVIDER` | Active AI provider (`gemini`, `openai`, `local`) | `gemini` |
| `CORS_ORIGINS` | Permitted frontend origins | `http://localhost:5173,https://krida-ai.vercel.app` |

### Frontend (`frontend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE` | Base URL for FastAPI REST backend | `/api` (local proxy) or `https://krida-api.onrender.com/api` |

---

## 3. Deploying Frontend to Vercel (Recommended)

1. Create a `vercel.json` inside `frontend/` (or repository root):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
2. Import repository into [Vercel](https://vercel.com).
3. Set the Root Directory to `frontend`.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variable:
   - `VITE_API_BASE`: `https://your-backend.onrender.com/api`
7. Click **Deploy**.

---

## 4. Deploying Frontend to Netlify

1. Build the production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Drag and drop the `frontend/dist` folder to [app.netlify.com/drop](https://app.netlify.com/drop), OR connect via GitHub.
3. Configure settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Set `VITE_API_BASE` in Netlify Environment Variables.

---

## 5. Deploying FastAPI Backend to Render (Free Tier)

1. In [Render.com](https://render.com), click **New +** $\rightarrow$ **Web Service**.
2. Select your KRIDA repository.
3. Configure:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In Environment Variables, configure:
   - `DATABASE_URL`: Your Render PostgreSQL connection string (or leave blank to use persistent SQLite disk).
   - `SECRET_KEY`: A strong random string.
   - `GEMINI_API_KEY`: (Optional) Your Google Gemini API key.
   - `CORS_ORIGINS`: Your Vercel/Netlify frontend URL.
5. Deploy Web Service.

---

## 6. PostgreSQL Migration Steps (Optional for High-Concurrence Production)

To switch from SQLite to Managed PostgreSQL on Supabase or Neon:
1. Create a PostgreSQL database instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the connection string:
   ```
   DATABASE_URL=postgresql://neondb_owner:password@ep-round-pond.us-east-2.aws.neon.tech/kridadb?sslmode=require
   ```
3. Set `DATABASE_URL` in your backend environment variables.
4. On startup, `app.main:init_db()` will automatically create all tables (`users`, `profiles`, `workout_plans`, `workout_sessions`, `workout_exercises`, `workout_logs`, `food_items`, `nutrition_entries`, `skill_progress`, `conditioning_sessions`, `fitness_goals`, `recovery_records`) and seed initial verified exercise and food catalogs.

---

## 7. Verification Checklist

- [x] Run `python tests/test_e2e.py` (20/20 tests passing)
- [x] Run `npm run build` in `frontend/` (Zero TypeScript or bundling errors)
- [x] Verify hash routes `#/<tabId>` resolve on browser refresh
- [x] Verify CSV export downloads verified user training history
- [x] Verify safety guardrails redirect medical emergency queries to healthcare professionals
