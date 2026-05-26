# Getting Started - Choose Your Path

Welcome to Core! This guide helps you choose the fastest way to get started.

## Quick Decision Tree

```
Do you want to:
├─ Run locally for development?
│  └─ Go to: LOCAL_SETUP.md
│
├─ Deploy to production on Render?
│  ├─ Want one-click setup?
│  │  └─ Use render.json (see RENDER_DEPLOY.md - Option 1)
│  │
│  └─ Want manual setup?
│     └─ Follow RENDER_DEPLOY.md - Option 2
│
└─ Having problems?
   └─ Go to: RENDER_TROUBLESHOOTING.md
```

## Fastest Path (One Command)

### For Local Development
```bash
cd backend
npm install
npm run db:push
npm start
# Open: http://localhost:3100
```

### For Production (Render)
1. Push code to GitHub
2. Go to Render Dashboard
3. Click "New +" → "Blueprint"
4. Select your repository
5. Deploy!

Everything else is automatic.

## All Documentation Files

| File | Purpose | Time |
|------|---------|------|
| **LOCAL_SETUP.md** | Run locally on your computer | 5 min |
| **RENDER_DEPLOY.md** | Deploy to Render production | 15 min |
| **RENDER_ENV_GUIDE.md** | Understand environment variables | 10 min |
| **RENDER_TROUBLESHOOTING.md** | Fix problems | As needed |
| **README.md** | Project overview | 2 min |

## What You Get

- Real-time Kanban board with WebSockets
- User authentication with JWT
- Project management with team collaboration
- Task assignments and comments
- Live notifications
- Responsive design

## Technology Stack

**Local Development:**
- Node.js + Express
- SQLite (simple, file-based)
- Prisma ORM
- Socket.io for real-time

**Production (Render):**
- Node.js + Express
- PostgreSQL (production-grade)
- Prisma ORM
- Socket.io for real-time

## Step-by-Step: Quickest Route

### For Local Testing (5 minutes)

```bash
# 1. Clone and enter directory
git clone https://github.com/shivamonly/codealpha_tasks-2.git
cd codealpha_tasks-2

# 2. Install and setup database
cd backend
npm install
npm run db:push

# 3. Start server
npm start

# 4. Open browser
# Visit: http://localhost:3100
# Register → Login → Create Project → Add Tasks
```

### For Production on Render (10 minutes)

```bash
# 1. Make sure code is on GitHub
git add .
git commit -m "Ready for Render"
git push origin main

# 2. Go to Render Dashboard
# https://render.com/dashboard

# 3. Click "New +" then "Blueprint"

# 4. Select your repository (shivamonly/codealpha_tasks-2)

# 5. Render deploys automatically with:
#    ✓ PostgreSQL database
#    ✓ Node.js backend
#    ✓ Environment variables auto-configured
#    ✓ SSL certificate (HTTPS)

# 6. Get your backend URL
# https://core-backend-xxxx.onrender.com

# 7. Update frontend with backend URL
# Edit: /frontend/web/app.js
# Change: const BACKEND_URL = '...';

# 8. Deploy frontend to Netlify
# https://netlify.com → Import from GitHub → frontend/web
```

## Environment Variables

### Local (Automatic)
```
NODE_ENV=development
PORT=3100
DATABASE_URL=file:./dev.db
JWT_SECRET=dev_key
CORS_ORIGIN=http://localhost:3100
```

Just works! SQLite created automatically.

### Production (Set on Render)
```
NODE_ENV=production
PORT=3100
DATABASE_URL=<auto from PostgreSQL>
JWT_SECRET=<generate with openssl rand -hex 32>
CORS_ORIGIN=<your Netlify URL>
```

See **RENDER_ENV_GUIDE.md** for details.

## Deployment Comparison

| Aspect | Local | Render | Netlify |
|--------|-------|--------|---------|
| **Database** | SQLite (file) | PostgreSQL | ❌ Not supported |
| **Backend** | ✓ Express | ✓ Express | ❌ Not supported |
| **Frontend** | ✓ Served | ✓ Optional | ✓ Static files |
| **Real-time** | ✓ WebSocket | ✓ WebSocket | ❌ No backend |
| **Best for** | Development | Production | Frontend only |

## Common Questions

### "Can I use only Netlify?"
No. Netlify only hosts static files. You need Render for the Node.js backend.

### "Can I deploy everything to Render?"
Yes! The backend automatically serves the frontend. Use the render.json blueprint.

### "Do I need to pay?"
No! Both Render and Netlify have free tiers. You can deploy at zero cost.

### "How do I update the code?"
Push to GitHub → Render/Netlify automatically redeploys. No manual steps needed.

### "How do I add a team member?"
1. They create account in the app (register)
2. You invite them to project (via email)
3. They get notification
4. Done!

### "Can I use my own domain?"
Yes! Both Render and Netlify support custom domains.

## Support Resources

- **Having issues?** → **RENDER_TROUBLESHOOTING.md**
- **Need help with environment?** → **RENDER_ENV_GUIDE.md**
- **Want manual setup?** → **RENDER_DEPLOY.md**
- **Developing locally?** → **LOCAL_SETUP.md**

## Next Steps

Choose your path:

1. **Start Local Development**
   - Run: `cd backend && npm install && npm start`
   - Go to: LOCAL_SETUP.md
   - Time: 5 minutes

2. **Deploy to Render**
   - Go to: RENDER_DEPLOY.md
   - Time: 15 minutes
   - Result: Production-ready app

3. **Fix a Problem**
   - Go to: RENDER_TROUBLESHOOTING.md
   - Find your issue
   - Follow solution

## File Structure

```
codealpha_tasks-2/
  ├─ backend/
  │  ├─ server.js              # Express API
  │  ├─ prisma/schema.prisma   # Database schema
  │  └─ package.json
  ├─ frontend/web/
  │  ├─ index.html             # Main page
  │  ├─ app.js                 # JavaScript logic
  │  └─ styles.css             # Styling
  ├─ README.md                 # Project overview
  ├─ LOCAL_SETUP.md            # This file
  ├─ RENDER_DEPLOY.md          # Render instructions
  ├─ RENDER_ENV_GUIDE.md       # Environment guide
  ├─ RENDER_TROUBLESHOOTING.md # Problem solutions
  ├─ render.json               # Auto-deployment config
  └─ render.yaml               # Render config
```

## Ready? Let's Go!

Choose one:

- 👉 **[Local Development](LOCAL_SETUP.md)** - Run on your computer
- 👉 **[Production Deploy](RENDER_DEPLOY.md)** - Deploy to Render
- 👉 **[Troubleshooting](RENDER_TROUBLESHOOTING.md)** - Fix issues

Happy coding! 🚀
