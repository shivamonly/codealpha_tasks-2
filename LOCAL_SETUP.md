## Local Development Setup

This guide helps you set up the project locally for development.

### Prerequisites

- **Node.js** (v16 or higher) - https://nodejs.org/
- **npm** (comes with Node.js)
- **Git** - https://git-scm.com/

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/shivamonly/codealpha_tasks-2.git
cd codealpha_tasks-2
```

#### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file with defaults
cat > .env << EOF
NODE_ENV=development
PORT=3100
DATABASE_URL=file:./dev.db
JWT_SECRET=dev_secret_key_12345
CORS_ORIGIN=http://localhost:3100
EOF

# Setup database
npm run db:push
```

#### 3. Start the Server

```bash
npm start
```

You should see:
```
Core server running on http://localhost:3100
```

#### 4. Open Your Browser

Navigate to: **http://localhost:3100**

### First Time Usage

1. **Create an Account**
   - Click "Register"
   - Enter email, password (min 6 chars), and display name
   - Click "Create Account"

2. **Login**
   - Use your email and password
   - Click "Login"

3. **Create a Project**
   - Click "New Project"
   - Enter project name
   - Click "Create"

4. **Add Tasks**
   - Click any column to add a task
   - Drag tasks between columns
   - Click task to edit details

### Available Commands

```bash
cd backend

# Start development server
npm start

# Push database schema changes to database
npm run db:push

# Clear and reset database
npm run seed

# Both push and seed (full reset)
npm run db:push && npm run seed
```

### Folder Structure

```
backend/
  ├── server.js              # Main Express server
  ├── package.json           # Dependencies
  ├── .env                   # Environment variables (create this)
  ├── .env.example           # Example env file
  ├── dev.db                 # SQLite database (auto-created)
  └── prisma/
      ├── schema.prisma      # Database schema
      └── seed.js            # Database seed script

frontend/
  └── web/
      ├── index.html         # Main HTML file
      ├── app.js             # Client-side JavaScript
      └── styles.css         # Styling
```

### Database Schema

The application uses these main tables:

- **User** - User accounts with authentication
- **Project** - Workspaces/projects
- **ProjectMember** - User membership in projects
- **Column** - Kanban board columns
- **Task** - Cards in columns
- **Comment** - Task comments
- **ActivityLog** - Task activity history
- **Notification** - User notifications

### Troubleshooting

#### Port Already in Use

If port 3100 is already in use:

```bash
# Change PORT in .env
# Or kill the process:
lsof -ti:3100 | xargs kill -9
```

#### Database Errors

```bash
# Clear and reset database
cd backend
rm dev.db
npm run db:push
```

#### Module Not Found

```bash
# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

#### Login Not Working

1. Check console (F12 in browser)
2. Make sure backend is running (`npm start`)
3. Verify DATABASE_URL in .env is correct
4. Check `CORS_ORIGIN` includes `http://localhost:3100`

### Hot Reload (Optional)

For automatic restart on file changes, install nodemon:

```bash
cd backend
npm install --save-dev nodemon

# Update package.json start script:
# "start": "nodemon server.js"

npm start
```

### Testing the API

You can test API endpoints with curl or Postman:

```bash
# Register
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'

# Login
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get projects (replace TOKEN with the token from login)
curl -X GET http://localhost:3100/api/projects \
  -H "Authorization: Bearer TOKEN"
```

### Next Steps

After setting up locally:

1. **Modify the code** - Make changes to `server.js`, `app.js`, or `styles.css`
2. **Test changes** - Refresh browser (changes reload automatically)
3. **Deploy to Render** - See [RENDER_DEPLOY.md](RENDER_DEPLOY.md) when ready
4. **Invite team** - Add other users once deployed

### Getting Help

- Check `/user_read_only_context/v0_debug_logs.log` for error logs
- Look in browser console (F12) for frontend errors
- Check terminal output for backend errors
- Review [RENDER_DEPLOY.md](RENDER_DEPLOY.md) for production setup

Happy coding! 🚀
