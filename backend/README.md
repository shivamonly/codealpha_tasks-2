# Core Backend

Express + Prisma + SQLite backend for Core. It also serves the static web frontend from `../syncboard_frontend/web`.

## Scripts

```powershell
npm install
npm run db:push
npm run seed
npm start
```

The API and website run at `http://localhost:3100`.

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:id/invite`
- `GET /api/projects/:id/tasks`
- `POST /api/projects/:projectId/columns`
- `PATCH /api/columns/:id`
- `DELETE /api/columns/:id`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/:id/details`
- `POST /api/tasks/:id/comments`
- `GET /api/notifications`
- `PATCH /api/notifications/read`
- `DELETE /api/notifications`

Socket.io rooms are authenticated with the JWT and scoped by project/user rooms.
