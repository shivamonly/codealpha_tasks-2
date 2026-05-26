# Deployment Guide - Core Project Management

## What You Need to Know

**Your app has TWO parts:**
1. **Backend** - Node.js/Express server that handles login, database, real-time updates
2. **Frontend** - Static HTML/CSS/JavaScript that talks to the backend

**Why login returns 404 on Netlify:**
- Netlify only hosts static files (frontend)
- Your backend is on Render, but the frontend isn't configured to reach it
- Or the backend isn't running properly on Render

---

## SOLUTION 1: Deploy Backend to Render + Frontend to Netlify ✅ RECOMMENDED

This is the most flexible setup - backend and frontend can scale independently.

### Step 1: Deploy Backend to Render

1. **Go to https://render.com** and sign up (free tier available)

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo `shivamonly/codealpha_tasks-2`
   - Choose main branch

3. **Configure the Service:**
   - **Name**: `codealpha-backend` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run db:push && npm run seed`
   - **Start Command**: `cd backend && npm start`

4. **Add Environment Variables** (in Render dashboard):
   - `PORT` = `3100`
   - `JWT_SECRET` = `generate_a_random_string_like_abc123xyz789` (must be strong/unique)
   - `CORS_ORIGIN` = `https://yoursitename.netlify.app` (replace with your actual Netlify domain)

5. **Click Deploy** and wait 5-10 minutes

6. **Copy your backend URL** (looks like `https://codealpha-backend-xxxxx.onrender.com`)

### Step 2: Update Frontend Configuration

**File: `/frontend/web/app.js` - Line 1**

Change:
```javascript
const BACKEND_URL = 'https://codealpha-tasks-2-s5uz.onrender.com';
```

To:
```javascript
const BACKEND_URL = 'https://codealpha-backend-xxxxx.onrender.com'; // Your actual URL from Step 1
```

**Commit and push to GitHub:**
```bash
git add frontend/web/app.js
git commit -m "Update backend URL for Render deployment"
git push origin main
```

### Step 3: Deploy Frontend to Netlify

1. **Go to https://netlify.com** and sign in (connect GitHub)

2. **Add New Site:**
   - Click "Add new site" → "Import an existing project"
   - Select `shivamonly/codealpha_tasks-2` repository
   - Choose `main` branch

3. **Configure Build Settings:**
   - **Build Command**: Leave empty (no build needed)
   - **Publish Directory**: `frontend/web`

4. **Click Deploy** and wait 2-3 minutes

5. **Your site is live!** Use the URL provided (e.g., `https://xyz.netlify.app`)

---

## SOLUTION 2: Deploy Everything to Render ✅ SIMPLER

This deploys backend AND frontend together - simpler but less scalable.

1. **Go to https://render.com** and create a new Web Service

2. **Select your GitHub repo and configure:**
   - **Build Command**: `cd backend && npm install && npm run db:push && npm run seed`
   - **Start Command**: `cd backend && npm start`
   - **Add environment variable**: `JWT_SECRET` = `your_random_secure_string`

3. **Click Deploy**

4. **That's it!** Your app runs at the Render URL provided

**Why this works:**
- Your backend has built-in static file serving for the frontend
- Backend serves the frontend files automatically
- Everything is on one server

---

## Testing Your Deployment

### Local Testing (Before Deployment)

```bash
# Terminal 1: Start backend
cd backend
npm install
npm run db:push
npm run seed
npm start

# Terminal 2: Open browser to
http://localhost:3100
```

### Production Testing (After Deployment)

1. Open your deployed URL
2. Click "Register" and create an account
3. Click "Login" with your credentials
4. If login works → You're done! 🎉
5. If login shows error → Check console (F12) for error details

---

## Troubleshooting

### Problem: Login returns 404
**Cause**: Backend URL in app.js is wrong or backend is down
**Fix**: 
- Check backend URL in `/frontend/web/app.js` line 1
- Verify backend is running on Render dashboard
- Try accessing backend directly: `https://your-backend-url/api/projects` in browser
- Should get error about missing auth token (not 404)

### Problem: CORS Error (browser console shows)
**Cause**: Backend CORS_ORIGIN doesn't match your frontend URL
**Fix**:
- Update `CORS_ORIGIN` environment variable on Render
- Should be: `https://yoursitename.netlify.app`
- Redeploy backend after changing

### Problem: WebSocket Connection Failed
**Cause**: Browser trying to connect over HTTP instead of HTTPS
**Fix**:
- This happens automatically with deployed apps (HTTPS required)
- Make sure backend URL uses `https://` not `http://`

### Problem: Can't access database/seed data
**Cause**: Seed script didn't run or database is corrupted
**Fix**:
```bash
cd backend
npm run db:push
npm run seed
```

---

## Environment Variables Explained

| Variable | Where | Example | Purpose |
|----------|-------|---------|---------|
| `JWT_SECRET` | Backend on Render | `supersecretkey123` | Encrypts login tokens - MUST be unique and long |
| `PORT` | Backend on Render | `3100` | What port backend runs on |
| `CORS_ORIGIN` | Backend on Render | `https://xyz.netlify.app` | Allows frontend to talk to backend |
| `DATABASE_URL` | Backend (optional) | `file:./dev.db` | SQLite database location (default is fine) |

---

## Quick Reference Commands

### Local Development
```bash
cd backend
npm install         # Install dependencies
npm run db:push     # Setup database
npm run seed        # Add sample data
npm start           # Start server at http://localhost:3100
```

### Production (on Render)
```bash
# Render automatically runs these:
cd backend && npm install && npm run db:push && npm run seed    # Build
cd backend && npm start                                          # Start
```

---

## File Locations

```
codealpha_tasks-2/
├── backend/
│   ├── server.js              ← Main server code
│   ├── package.json           ← Dependencies
│   └── prisma/
│       ├── schema.prisma      ← Database schema
│       └── seed.js            ← Sample data
├── frontend/
│   └── web/
│       ├── index.html         ← Main page
│       ├── app.js             ← Frontend code (UPDATE LINE 1 HERE!)
│       └── styles.css         ← Styling
├── netlify.toml               ← Netlify config
└── README.md
```

---

## Next Steps

1. ✅ Deploy backend to Render (Solution 1 or 2)
2. ✅ Update `app.js` with backend URL
3. ✅ Deploy frontend to Netlify
4. ✅ Test login on your live site
5. ✅ Share the URL with your team!

Need help? Check the README.md file or test locally first.
