## Deploy to Render (PostgreSQL Edition)

This guide walks you through deploying your Core application to Render with a PostgreSQL database.

### Prerequisites
- GitHub account with your repository
- Render account (free tier available at https://render.com)
- Code pushed to your GitHub repository

### Option 1: Deploy Using render.json (Recommended - One Click)

The easiest way - Render will automatically set up both the backend and PostgreSQL database.

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Make website Render-friendly with PostgreSQL"
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit https://render.com/dashboard
   - Click "New +"
   - Select "Blueprint"

3. **Connect Your Repository**
   - Authorize GitHub access
   - Select `shivamonly/codealpha_tasks-2`
   - Choose branch: `main`

4. **Deploy the Blueprint**
   - Click "Deploy"
   - Render automatically creates:
     - Web Service (Node.js backend)
     - PostgreSQL Database
     - Environment variables

5. **Set Missing Environment Variables**
   - While deploying, set these in the web service environment:
     - `JWT_SECRET` = generate a strong random string
     - `CORS_ORIGIN` = your Netlify frontend URL (e.g., `https://your-site.netlify.app`)
     - `NODE_ENV` = `production`

6. **Wait for Deployment**
   - Both services will deploy automatically
   - Database URL is automatically injected from PostgreSQL service

### Option 2: Manual Deployment

If Option 1 doesn't work, deploy step-by-step:

#### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click "New +"
2. Select "PostgreSQL"
3. Configuration:
   - Name: `core-postgres`
   - Database: `core_db`
   - User: `postgres`
   - Plan: Free (if available)
4. Click "Create Database"
5. Copy the connection string (looks like: `postgresql://user:password@host:5432/dbname`)

#### Step 2: Create Web Service

1. In Render Dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configuration:
   - Name: `core-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install && npm run db:push`
   - Start Command: `cd backend && npm start`
   - Plan: Free

5. **Add Environment Variables** (before deploying):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3100` |
   | `JWT_SECRET` | Generate a strong random string (e.g., using `openssl rand -hex 32`) |
   | `CORS_ORIGIN` | Your Netlify frontend URL (e.g., `https://your-app.netlify.app`) |
   | `DATABASE_URL` | PostgreSQL connection string from Step 1 |

6. Click "Create Web Service"
7. Wait for deployment to complete

#### Step 3: Update Frontend

1. Edit `/frontend/web/app.js`
2. Find the line with `const BACKEND_URL`
3. Update it to your Render backend URL:
   ```javascript
   const BACKEND_URL = 'https://core-backend-xxxx.onrender.com';
   ```

4. Commit and push:
   ```bash
   git add frontend/web/app.js
   git commit -m "Update backend URL for Render deployment"
   git push
   ```

#### Step 4: Deploy Frontend to Netlify

1. Go to https://netlify.com
2. Click "Add new site"
3. Select "Import an existing project" → GitHub
4. Choose your repository
5. Configure:
   - Build command: (leave empty)
   - Publish directory: `frontend/web`
6. Click "Deploy site"

### Verifying Your Deployment

After everything is deployed:

1. **Test the Backend**
   - Visit `https://core-backend-xxxx.onrender.app`
   - Should load the web interface

2. **Test Login**
   - Create a new account
   - Login with your credentials
   - If successful, you're good!

3. **Check the Frontend**
   - Visit your Netlify URL
   - Should see the same application
   - Login should work seamlessly

### Troubleshooting

#### "Database Connection Failed"
- Check that `DATABASE_URL` environment variable is set correctly
- Verify PostgreSQL database is running (check in Render dashboard)
- Make sure the database has been initialized: `npm run db:push`

#### "Login Returns 404"
- Verify `BACKEND_URL` in `/frontend/web/app.js` matches your Render backend URL
- Check that `CORS_ORIGIN` environment variable includes your Netlify domain
- Check browser console (F12) for CORS errors

#### "Token Validation Failed"
- Make sure `JWT_SECRET` is set on backend
- Verify it's the same across all instances (if scaled up)

#### "WebSocket Connection Fails"
- Use HTTPS URLs (Render provides HTTPS by default)
- Check that your Render service is running (not suspended)

### Environment Variables Reference

**JWT_SECRET** - Authentication token signing key
- Generate: `openssl rand -hex 32` or use a password manager
- Keep this secret!
- Same value across all backend instances

**CORS_ORIGIN** - Allowed frontend URLs
- Examples: `http://localhost:3100` (dev), `https://example.netlify.app` (prod)
- Multiple origins: separate with commas

**DATABASE_URL** - PostgreSQL connection string
- Format: `postgresql://user:password@host:port/dbname`
- Provided by Render PostgreSQL service

**NODE_ENV** - Environment mode
- Set to `production` for Render
- Set to `development` for local development

### Local Development After Deployment

To continue developing locally while your app is on Render:

1. Create `.env` file in `/backend`:
   ```
   NODE_ENV=development
   PORT=3100
   DATABASE_URL=file:./dev.db
   JWT_SECRET=dev_secret_key
   CORS_ORIGIN=http://localhost:3100
   ```

2. Run locally:
   ```bash
   cd backend
   npm install
   npm run db:push
   npm start
   ```

3. Open `http://localhost:3100`

### Database Migrations

When you push new database changes:

1. Update `/backend/prisma/schema.prisma`
2. Render automatically runs `npm run db:push` on deploy
3. Changes are applied to PostgreSQL automatically

No manual migration steps needed!

### Monitoring and Logs

Access your Render service logs:

1. Go to Render Dashboard
2. Click on your service (`core-backend`)
3. View logs in real-time
4. Check for errors or issues

### Scaling (Future)

When you need to scale:

1. **Upgrade PostgreSQL**: Click on database → upgrade plan
2. **Upgrade Web Service**: Click on service → select higher plan
3. **Add multiple instances**: Configure auto-scaling

### Support

For issues:
- Check Render documentation: https://render.com/docs
- View service logs in Render dashboard
- Check your backend URL is accessible

Next steps: Test your deployment with the steps above!
