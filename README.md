# AI-Powered Project Management Copilot

Enterprise project planning SaaS with a Next.js frontend and a separate Node/Express backend.

## Structure

```txt
project-root/
  frontend/
  backend/
  .env
  README.md
```

## Stack

- Frontend: Next.js 15, TypeScript, TailwindCSS, shadcn-style UI primitives
- Backend: Node.js, Express.js, MongoDB/Mongoose
- AI: LangChain + Groq
- Vector store: ChromaDB HTTP service
- Auth: JWT, bcrypt password hashing, Admin/User RBAC

## Run Locally

1. Update `.env` with real values for `JWT_SECRET`, `GROQ_API_KEY`, MongoDB, and ChromaDB.
2. Install dependencies:

```bash
cd backend
npm install
cd ../frontend
npm install
```

3. Start MongoDB and ChromaDB.
4. Start the backend:

```bash
cd backend
npm run dev
```

5. Start the frontend:

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:5001`

## n8n Webhook

When project planning starts, the backend sends an unauthenticated `POST` request to `N8N_PROJECT_PLANNING_WEBHOOK_URL`.
Set the value in `.env`:

```txt
N8N_PROJECT_PLANNING_WEBHOOK_URL=https://your-n8n-domain/webhook/project-planning
```

## Production Notes

- Deploy `frontend/` to Vercel.
- Deploy `backend/` to a Node-compatible host such as Render, Railway, Fly.io, or a VM.
- Configure the same environment variables in both deployment targets.
- `NEXT_PUBLIC_API_URL` should point to the deployed backend `/api` URL.
- `N8N_PROJECT_PLANNING_WEBHOOK_URL` should point to the n8n project-planning webhook.

## Core Flow

1. A user registers or logs in.
2. The user creates a project from a software requirement.
3. The backend retrieves relevant templates from ChromaDB.
4. LangChain sends requirement + retrieved context to Groq.
5. Seven agents execute in order and persist status, outputs, and execution time.
6. The frontend polls and visualizes running/completed agents.
7. Reports and exports are available as PDF, DOCX, and XLSX.
