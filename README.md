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

## Quick Start

```bash
cd backend
npm install
npm run db:push
npm run seed
npm start
```

Then open http://localhost:3000

## Project Structure

```
Task3/
  backend/           - Express + Prisma API server
    server.js        - Main server with Socket.io
    prisma/
      schema.prisma  - Database schema
      seed.js        - Sample data
  frontend/          - Static frontend (serves from backend)
    web/
      index.html     - Main app page
      app.js         - Client-side JavaScript
      styles.css     - UI styling
  netlify.toml       - Deployment config
```
