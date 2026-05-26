# 🚀 QUICK START - Choose Your Path

## I Just Cloned the Project - Get Running NOW

```bash
# Mac/Linux
chmod +x start.sh
./start.sh

# Windows
start.bat
```

Then open: **http://localhost:3100**

✅ Done! You're running locally.

---

## I Want to Deploy (Fix the 404 Error)

### Path A: Backend on Render + Frontend on Netlify (RECOMMENDED)

**Time: ~15 minutes**

1. Deploy backend to Render:
   - Go to https://render.com → "New Web Service"
   - Connect repo → Build: `cd backend && npm install && npm run db:push && npm run seed`
   - Start: `cd backend && npm start`
   - Add env: `JWT_SECRET` = `generate_random_string` and `CORS_ORIGIN` = your Netlify domain
   - Get backend URL (e.g., `https://xxx.onrender.com`)

2. Update frontend:
   - Open `/frontend/web/app.js` line 1
   - Change `BACKEND_URL` to your Render URL
   - Push to GitHub

3. Deploy frontend to Netlify:
   - Go to https://netlify.com → Import project
   - Build: (leave empty)
   - Publish: `frontend/web`
   - Deploy

4. Test login on your Netlify URL → Should work! ✅

### Path B: Everything on Render (SIMPLER)

**Time: ~7 minutes**

1. Go to https://render.com → "New Web Service"
2. Build: `cd backend && npm install && npm run db:push && npm run seed`
3. Start: `cd backend && npm start`
4. Add env: `JWT_SECRET` = `generate_random_string`
5. Deploy → Open your Render URL → Login works! ✅

---

## I Have Login Errors

### Error: Login returns 404
```
✅ Solution: Check backend is deployed
- Open backend URL directly in browser
- Should show error "Missing Authorization header" (not 404)
- If 404 → Backend not running
```

### Error: CORS error in console
```
✅ Solution: Update CORS_ORIGIN on Render
- Set to your Netlify/Render domain (e.g., https://xyz.netlify.app)
- Redeploy after changing
```

### Error: WebSocket connection failed
```
✅ Solution: Use HTTPS, not HTTP
- This happens automatically on deployed sites
- Works perfectly locally over HTTP
```

---

## Commands Reference

### Local Development
```bash
# Start everything
./start.sh (Mac/Linux) or start.bat (Windows)

# Or manually
cd backend
npm install
npm run db:push  # Setup database
npm run seed     # Add sample data
npm start
```

### Production (Automatic on Render)
```bash
cd backend && npm install && npm run db:push && npm run seed  # Build
cd backend && npm start                                        # Start
```

---

## File Locations

| File | Purpose |
|------|---------|
| `/frontend/web/app.js` | **Line 1 - Change BACKEND_URL here** |
| `/backend/server.js` | Backend logic |
| `/backend/.env` | Backend environment (create from .env.example) |
| `/netlify.toml` | Netlify config |
| `/render.yaml` | Render config |

---

## Deployment Summary

**Why do you have login 404 on Netlify?**
- Netlify = Frontend only (no backend)
- Your API calls fail because no backend is running
- Solution: Deploy backend to Render or use Render for everything

**What gets deployed where?**

| Component | Deploy To | Time |
|-----------|-----------|------|
| Backend (Node/Express) | Render | 5 min |
| Frontend (HTML/CSS/JS) | Netlify | 3 min |

**Total setup time: 15-20 minutes**

---

## Testing Locally Before Deploying

```bash
# 1. Start server
./start.sh

# 2. Register
- Email: test@example.com
- Password: test123
- Display Name: Test User

# 3. Create project
- Click "New Project"
- Name: My Test Project

# 4. Add column
- Name: To-Do

# 5. Create task
- Title: First Task
- Priority: High

# 6. If this works locally → You're ready to deploy!
```

---

## Next Steps After Deploy

✅ Local testing works
✅ Backend deployed to Render
✅ Frontend deployed to Netlify
✅ Login works on live site

Now:
1. Invite team members to your domain
2. Create shared projects
3. Collaborate in real-time
4. Use real team emails instead of test data

---

## Getting Help

1. Check the browser console (F12) for error details
2. Read README.md for more info
3. Read DEPLOY.md for detailed deployment steps
4. Read SETUP.md for local setup help

**Still stuck?**
- Verify backend URL is correct in app.js
- Make sure backend is running (check Render dashboard)
- Clear browser cache and try again
- Check that environment variables are set on Render

---

## Success Checklist

- [ ] App runs locally with `./start.sh`
- [ ] Can register and login locally
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Netlify
- [ ] app.js updated with backend URL
- [ ] Can login on live Netlify URL
- [ ] Real-time updates work
- [ ] Can create projects and tasks
- [ ] WebSocket connection shows "Connected"

All checked? You're done! 🎉
