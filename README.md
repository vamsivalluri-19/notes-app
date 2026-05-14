# notes-app

Full-stack notes portal with role-based staff and student features.

## Project Structure

- `notes-app/frontend`: React + Vite client (deploy to Vercel)
- `notes-app/backend`: Express + MongoDB API (deploy to Render)

## Deploy Backend to Render

1. Create a new **Web Service** in Render from this GitHub repository.
2. Set **Root Directory** to `notes-app/backend`.
3. Use build/start commands:
	- Build: `npm install`
	- Start: `npm start`
4. Add environment variables:
	- `MONGO_URI`
	- `JWT_SECRET`
	- `CORS_ORIGIN` (your Vercel frontend URL)
	- `PORT` is optional on Render (Render provides it automatically)

The backend health endpoint is available at `/health`.

## Deploy Frontend to Vercel

1. Import the same repository in Vercel.
2. Set **Root Directory** to `notes-app/frontend`.
3. Add environment variable:
	- `VITE_API_URL` = your Render backend URL (for example `https://notes-app-backend.onrender.com`)
4. Build settings:
	- Build command: `npm run build`
	- Output directory: `dist`

SPA rewrites are configured in `notes-app/frontend/vercel.json`.

## Environment Templates

- Backend template: `notes-app/backend/.env.example`
- Frontend template: `notes-app/frontend/.env.example`