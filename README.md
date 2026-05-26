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
- Backend: Node.js, Express, Socket.io, Prisma, PostgreSQL
- Frontend: Vanilla JS, Material Symbols Icons, Inter font

## Quick Start - LOCAL DEVELOPMENT

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run db:push
npm start
```

The backend will run on `http://localhost:3100` by default.

### 2. Open the Application
Open your browser to `http://localhost:3100` - the frontend is served from the backend.

**Note**: Local development uses SQLite for simplicity. See [RENDER_DEPLOY.md](RENDER_DEPLOY.md) for PostgreSQL production setup.

## Deployment Guide

### **Production (Render + PostgreSQL) - RECOMMENDED**

For a fully production-ready deployment with automatic database management:

👉 **See [RENDER_DEPLOY.md](RENDER_DEPLOY.md)** for complete step-by-step instructions.

**Quick Summary:**
1. Push code to GitHub
2. Use Render's one-click blueprint deployment (or manual setup)
3. PostgreSQL database automatically created
4. Backend runs at `https://your-backend.onrender.com`
5. Update frontend with backend URL
6. Deploy frontend to Netlify

### **Development (Local)**

```bash
# Clone and setup
git clone <your-repo>
cd codealpha_tasks-2/backend

# Install and run
npm install
npm run db:push
npm start

# Open http://localhost:3100
```

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

**Local Development (SQLite):**
```
NODE_ENV=development
PORT=3100
DATABASE_URL=file:./dev.db
JWT_SECRET=dev_secret_key_here
CORS_ORIGIN=http://localhost:3100
```

**Production (PostgreSQL on Render):**
```
NODE_ENV=production
PORT=3100
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your_secure_random_string_here
CORS_ORIGIN=https://your-netlify-domain.netlify.app
```

See [RENDER_DEPLOY.md](RENDER_DEPLOY.md) for detailed environment setup.

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
