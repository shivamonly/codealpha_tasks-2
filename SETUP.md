# SETUP & GETTING STARTED

## Step 1: Clone and Setup Locally

```bash
# Clone the repository
git clone https://github.com/shivamonly/codealpha_tasks-2.git
cd codealpha_tasks-2

# Run the easy start script
# On Mac/Linux:
chmod +x start.sh
./start.sh

# On Windows:
start.bat
```

Or manually:

```bash
cd backend
npm install
npm run db:push
npm run seed
npm start
```

Then open **http://localhost:3100** in your browser.

## Step 2: Test Login Locally

1. Click **"Register"** tab
2. Enter:
   - Email: `demo@example.com`
   - Password: `demo123`
   - Display Name: `Demo User`
3. Click **"Create Account"**
4. You should see the project board
5. Try creating a project, adding columns, and creating tasks

## Step 3: Deploy to Production

See **DEPLOY.md** for detailed deployment instructions.

### Quick Deploy Options:

**Option A: Render (Backend) + Netlify (Frontend)** - Recommended
```
1. Deploy backend to Render (5 minutes)
2. Update app.js with backend URL
3. Deploy frontend to Netlify (3 minutes)
```

**Option B: Everything on Render** - Simpler
```
1. Deploy entire project to Render (7 minutes)
2. That's it!
```

## Step 4: Use Your Deployed App

Once deployed:
1. Open your Netlify or Render URL
2. Register a new account
3. Create projects and collaborate with your team
4. Share the URL with others to invite them

## Troubleshooting

### Backend won't start
```bash
cd backend
npm install
npm run db:push
npm start
```

### Database error
```bash
# Reset database
rm backend/dev.db
npm run db:push
npm run seed
```

### Port already in use
The app will try ports: 3100, 3000, 5000, 8080
Or set manually: `PORT=3101 npm start`

### Login returns 404 on Netlify
- Make sure backend is deployed and running
- Check that `app.js` has the correct backend URL
- Try accessing backend directly in browser: `https://your-backend-url/api/projects`

## Features to Try

✅ **Authentication**: Register, login, logout
✅ **Projects**: Create multiple projects
✅ **Columns**: Add To-Do, In Progress, Done columns
✅ **Tasks**: Create tasks with title, description, priority, due date
✅ **Assignments**: Assign tasks to team members
✅ **Real-time**: Changes sync instantly across browsers
✅ **Comments**: Add comments to tasks
✅ **Notifications**: Get notified of project updates
✅ **Search**: Find tasks by keyword

## Project Structure

```
backend/
├── server.js              Main Express/Socket.io server
├── prisma/
│   ├── schema.prisma      Database schema
│   └── seed.js            Sample data
└── package.json           Dependencies

frontend/web/
├── index.html             Main HTML
├── app.js                 Frontend logic
└── styles.css             UI styling
```

## Environment Variables

All environment variables are configured automatically for local development.

For production, set on your hosting platform (Render/Netlify):
- `JWT_SECRET` - Secret key for tokens
- `CORS_ORIGIN` - Your frontend URL
- `PORT` - Server port (default: 3100)

## Need Help?

1. Check the browser console (F12) for error messages
2. Check the server logs in terminal
3. Make sure backend is running and accessible
4. Verify database has permissions to write to dev.db
5. Try deleting node_modules and running npm install again

## Next Steps

1. ✅ Run locally with `./start.sh` or `start.bat`
2. ✅ Test creating projects and tasks
3. ✅ Deploy backend to Render
4. ✅ Deploy frontend to Netlify
5. ✅ Invite team members to your deployed app
6. ✅ Customize the styling in styles.css
7. ✅ Add more features or integrate with other tools
