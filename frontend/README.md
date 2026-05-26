# Core Web Frontend

Minimal black-and-white web app for project boards, assigned tasks, and task chat.
The public entry page uses a Glides-inspired editorial layout with sticky section navigation, a capability strip, feature notes, tech stack notes, and smooth click motion.

## Features

- Email/password login and registration
- Project creation and member invitations
- Kanban columns with draggable task cards
- Task assignment, priority, due dates, comments, and activity
- Messenger-style chat for tasks assigned to the current user
- In-app notifications and Socket.IO live refreshes
- Public explanation sections for workflow, requirements, and the tech stack

## Run Locally

From `syncboard_backend`:

```powershell
npm install
npm run db:push
npm run seed
npm start
```

Open `http://localhost:3100`.
