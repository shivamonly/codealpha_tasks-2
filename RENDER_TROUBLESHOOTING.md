# Render Troubleshooting Guide

Common issues and solutions for deploying to Render.

## Database Issues

### "DATABASE_CONNECTION_ERROR" or "ECONNREFUSED"

**Problem**: Backend can't connect to PostgreSQL database.

**Solutions**:
1. Verify DATABASE_URL environment variable is set
   - Go to Render dashboard → Service → Environment
   - Check that DATABASE_URL contains the PostgreSQL connection string
   
2. Check PostgreSQL service is running
   - Go to Resources tab
   - PostgreSQL should show "Live" status (green)
   
3. Run database migration
   - Check build logs for errors
   - If migration failed, manually trigger:
     ```bash
     # This runs during deployment: npm run db:push
     ```
   
4. Wait for database to initialize
   - On first deploy, PostgreSQL takes time to start
   - Wait 2-3 minutes after seeing green "Live" status

**Fix**: 
```bash
# Restart the service:
# Go to Render dashboard → Service → Manual Deploy
```

### "table "user" does not exist"

**Problem**: Database tables haven't been created.

**Solution**:
1. Check that `npm run db:push` ran successfully
   - View build logs in Render dashboard
   - Should see: "✔ Deployed"
   
2. If missing, manually run migration:
   - Unfortunately can't SSH into Render free tier
   - Solution: Redeploy with working code

### "Connection pool exhausted"

**Problem**: Too many database connections.

**Solutions**:
1. Upgrade to paid PostgreSQL plan (free tier limited)
2. Reduce connection pool size in Prisma (advanced)
3. Check for connection leaks in code

## Authentication & Tokens

### "Invalid or expired token"

**Problem**: Login tokens not working.

**Solutions**:
1. Verify JWT_SECRET is set
   - Dashboard → Environment
   - JWT_SECRET should exist
   
2. Check JWT_SECRET is same everywhere
   - All backend instances need identical JWT_SECRET
   - If changed, old tokens become invalid
   
3. Clear browser cookies and re-login
   - Browser may have stale token
   - Login again to get new token

### "Access token missing"

**Problem**: Frontend not sending token to backend.

**Solutions**:
1. Check browser console (F12)
2. Verify login actually succeeded (check localStorage)
3. Check CORS configuration (see next section)
4. Verify token is being sent in Authorization header

## CORS Issues

### "CORS policy: No 'Access-Control-Allow-Origin' header"

**Problem**: Browser blocks requests due to CORS.

**Solutions**:
1. Verify CORS_ORIGIN environment variable
   - Should exactly match your frontend URL
   - Example: `https://my-app.netlify.app`
   
2. Check for trailing slash issues
   - Frontend: `https://my-app.netlify.app`
   - Backend CORS_ORIGIN: `https://my-app.netlify.app` (exact match)
   
3. Multiple origins (comma-separated):
   ```
   https://my-app.netlify.app,https://staging.netlify.app
   ```
   
4. Local development:
   ```
   http://localhost:3100
   ```

5. After changing CORS_ORIGIN:
   - Restart the service
   - Clear browser cache
   - Try again

### "CORS policy: response to preflight request"

**Problem**: Browser's preflight request rejected.

**Solution**:
- This usually indicates CORS_ORIGIN mismatch
- Follow steps above for CORS configuration

## Frontend Connection Issues

### "Cannot reach backend" or Blank page

**Problem**: Frontend can't connect to backend.

**Solutions**:
1. Verify backend is deployed and running
   - Render dashboard should show green "Live" status
   - Try accessing backend URL in browser
   - Should load the application

2. Check backend URL in frontend code
   - File: `/frontend/web/app.js`
   - First line should be:
     ```javascript
     const BACKEND_URL = 'https://core-backend-xxxx.onrender.com';
     ```
   - Must match your actual Render service URL

3. Check for HTTPS
   - Render provides HTTPS automatically
   - URLs should start with `https://`
   - Not `http://`

4. Wait for deployment
   - Frontend may be deployed before backend
   - Wait a few minutes for both to stabilize
   - Then refresh browser

### "WebSocket connection failed"

**Problem**: Real-time updates not working.

**Solutions**:
1. Verify backend URL uses HTTPS
   - Must be `https://...`
   - Not `http://...`
   
2. Check that backend is running
   - Curl the backend URL
   - Should see HTML response
   
3. Verify CORS allows WebSocket
   - Backend automatically handles this
   - If issues persist, check service logs

4. Try hard refresh
   - `Ctrl+Shift+R` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)

## Login Returns 404

### "POST /api/auth/login 404"

**Problem**: Login endpoint not found.

**Causes**:
1. Frontend talking to wrong backend
2. Backend is down
3. CORS blocking the request

**Solutions**:
1. Verify backend is running
   - Check Render dashboard
   - Status should be green "Live"
   
2. Check backend URL in frontend
   - Edit `/frontend/web/app.js` line 1
   - Update `BACKEND_URL` to your Render URL
   
3. Test backend directly
   - Copy your backend URL
   - Paste in browser
   - Should load the app interface
   
4. Check browser console for actual error
   - F12 → Console tab
   - Look for real error message (usually CORS or 404)

## Deployment Hangs or Fails

### "Build takes forever" or "Killed by builder"

**Problem**: Build process times out.

**Solutions**:
1. Check for large dependencies
   - Look at `npm install` logs
   - Some packages take time to build
   
2. Free tier has resource limits
   - Builds limited to ~30 minutes
   - Upgrade to paid if needed
   
3. Check git history
   - Make sure you're not including node_modules
   - `.gitignore` should exclude them

### "Deployment failed"

**Solutions**:
1. Check build logs
   - Go to Render → Service → Logs
   - Look for error messages
   
2. Common errors:
   - **"npm: command not found"**: Node not installed
   - **"ENOENT: no such file"**: File path wrong
   - **"Cannot find module"**: Missing dependency
   
3. Fix in code, commit, and redeploy:
   ```bash
   git add .
   git commit -m "Fix deployment issue"
   git push origin main
   # Render auto-redeploys
   ```

## Performance Issues

### "App is very slow"

**Solutions**:
1. Free tier is resource-limited
   - Each request is slower
   - Upgrade to paid plan for better performance
   
2. Database queries are slow
   - Check Render PostgreSQL status
   - May need to upgrade plan
   
3. Check service logs for errors
   - Errors slow down requests
   - Look for 5xx status codes

### "Service keeps restarting"

**Problem**: Service in restart loop.

**Solutions**:
1. Check logs for crash errors
   - Render → Logs
   - Look for stack traces
   
2. Common causes:
   - Out of memory
   - Infinite loop in code
   - Database connection error
   
3. Fix code and redeploy

## Checking Service Status

### View Logs
1. Go to Render dashboard
2. Click your service name
3. Click "Logs" tab
4. View real-time logs

### View Environment
1. Click "Environment" tab
2. Check all variables are set
3. Verify values are correct

### Manual Deploy
1. Click "Manual Deploy"
2. Choose "Deploy latest commit"
3. Service will rebuild and restart

### Check Resource Usage
1. Click "Metrics" tab
2. View CPU, memory, and network usage
3. Helps identify performance issues

## Getting Help

If you can't find a solution:

1. **Check Render Documentation**: https://render.com/docs
2. **View Service Logs**: Most errors shown there
3. **Verify Environment Variables**: Dashboard → Environment
4. **Test Backend Directly**: Visit your backend URL in browser
5. **Check Frontend Logs**: Browser F12 → Console tab
6. **Read Error Messages Carefully**: Usually describes the problem

## Quick Checklist

Before asking for help, verify:
- [ ] PostgreSQL service is "Live" (green)
- [ ] Web service is "Live" (green)
- [ ] DATABASE_URL environment variable is set
- [ ] JWT_SECRET environment variable is set
- [ ] CORS_ORIGIN matches frontend URL exactly
- [ ] NODE_ENV is set to "production"
- [ ] Frontend URL (in app.js) matches backend service
- [ ] Backend is accessible (visit URL in browser)
- [ ] Logs show no errors
- [ ] Deployed code is latest from GitHub

## Still Having Issues?

1. Take a screenshot of the error
2. Check browser console (F12 → Console)
3. Check Render service logs
4. Note the exact steps to reproduce
5. Share with support or debug team
