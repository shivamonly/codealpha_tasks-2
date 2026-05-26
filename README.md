# Core - Collaborative Project Management

A real-time Kanban-style workspace for teams. Create projects, organize tasks into columns, assign team members, and collaborate with live updates via WebSockets.

## Features
- User authentication (JWT)
- Kanban board with columns and task cards
- Task priorities, due dates, and assignee management
- Real-time sync across clients (Socket.io)
- Comments, activity logs, and notifications
- Invite team members to projects

## Stack
- Backend: Node.js, Express, Socket.io, Prisma, SQLite
- Frontend: Vanilla JS, Material Symbols Icons, Inter font

## Quick Start - LOCAL DEVELOPMENT

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run db:push
npm run seed
npm start
```

The backend will run on `http://localhost:3100` by default.

### 2. Open the Application
Open your browser to `http://localhost:3100` - the frontend is served from the backend.

## Deployment Guide

### Option A: Deploy Backend to Render + Frontend to Netlify (RECOMMENDED)

#### Step 1: Deploy Backend to Render
1. Go to https://render.com and sign in
2. Create a new "Web Service" from your GitHub repo
3. Set Build Command: `cd backend && npm install && npm run db:push && npm run seed`
4. Set Start Command: `cd backend && npm start`
5. Add Environment Variables:
   - `PORT` = `3100`
   - `JWT_SECRET` = (use a strong random string)
   - `CORS_ORIGIN` = your Netlify domain (e.g., `https://your-site.netlify.app`)
6. Deploy and note your Render URL (e.g., `https://codealpha-tasks-2-s5uz.onrender.com`)

#### Step 2: Update Frontend for Netlify Deployment
The frontend needs to know your backend URL:
1. Update `/frontend/web/app.js` line 1 with your Render backend URL
2. Commit and push to GitHub

#### Step 3: Deploy Frontend to Netlify
1. Go to https://netlify.com and connect your GitHub repo
2. Set Build Settings:
   - Build Command: (leave empty)
   - Publish Directory: `frontend/web`
3. Deploy

### Option B: Deploy Everything to Render (SIMPLER)

If you want login to work directly, deploy the entire stack to Render:

1. Create a new Web Service on Render
2. Set Build Command: `cd backend && npm install && npm run db:push && npm run seed`
3. Set Start Command: `cd backend && npm start`
4. Set PORT environment variable to `3100`
5. The backend automatically serves the frontend from `/frontend/web`

This works because the backend has `app.use(express.static(FRONTEND_DIR))` built in.

## Why Login Returns 404 on Netlify

When you deploy only the frontend to Netlify:
- Netlify serves the HTML/CSS/JS files ✅
- Your frontend JavaScript tries to call `/api/auth/login` ✗
- Netlify can't find the API endpoint (404 error) because there's no backend

**Solution**: Either:
1. Deploy backend separately (Render, Heroku, etc.) and update the API URL in `app.js`
2. Deploy the entire project to Render (backend + frontend together)

## Project Structure

```
codealpha_tasks-2/
  backend/                   - Express + Prisma API server
    server.js               - Main server with Socket.io
    prisma/
      schema.prisma         - Database schema
      seed.js               - Sample data
    package.json
  frontend/
    web/
      index.html            - Main app page
      app.js                - Client-side JavaScript
      styles.css            - UI styling
  netlify.toml              - Netlify deployment config
  README.md                 - This file
```

## Testing Login Locally

After starting the backend with `npm start`:

1. Create account: Register with email/password
2. Login: Use the same credentials
3. Create project: Click "New Project" button
4. Invite team: Add other users to your project

## Environment Variables

### Backend (.env in /backend directory)
```
PORT=3100
JWT_SECRET=your_secure_random_string_here
DATABASE_URL=file:./dev.db (default)
CORS_ORIGIN=http://localhost:3100 (local) or https://your-netlify-domain.netlify.app (production)
```

### Frontend (no .env file - configured in app.js)
- Change `BACKEND_URL` in `/frontend/web/app.js` to match your backend deployment URL

## Troubleshooting

### Login Returns 404
- Check that backend is running and accessible
- Verify the backend URL in `app.js` matches your deployment
- Check browser console (F12) for CORS errors

### WebSocket Connection Fails
- Make sure your backend URL uses HTTPS on production
- Check that WebSocket connections are allowed in your hosting

### Database Issues
- Run `npm run db:push` to sync schema
- Run `npm run seed` to add sample data
- Check that `dev.db` has write permissions
