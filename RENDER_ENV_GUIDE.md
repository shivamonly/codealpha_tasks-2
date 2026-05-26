# Render Environment Variables Guide

This document explains all environment variables needed for Render deployment.

## Required Variables for Render

### 1. NODE_ENV
- **Value**: `production`
- **Purpose**: Tells Node.js to run in production mode
- **Why**: Disables debug logging, enables optimizations

### 2. PORT
- **Value**: `3100`
- **Purpose**: Port number the Express server listens on
- **Why**: Render assigns a port; we use 3100 as default
- **Important**: Set to 3100, don't change this

### 3. DATABASE_URL
- **Value**: PostgreSQL connection string (auto-provided by Render)
- **Format**: `postgresql://username:password@host:port/dbname`
- **Example**: `postgresql://postgres:AbCdEfGh@pg-xyz.render.com:5432/core_db`
- **Why**: Connects your Express backend to PostgreSQL
- **Auto-set**: When using render.json or Blueprint

### 4. JWT_SECRET
- **Value**: Long random string (generate with OpenSSL)
- **Generate**: 
  ```bash
  openssl rand -hex 32
  ```
  Output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Purpose**: Signs and verifies authentication tokens
- **Security**: 
  - Keep this secret!
  - Never commit to GitHub
  - Use different values for dev and production
  - If compromised, regenerate and update
  - Same value for all backend instances

### 5. CORS_ORIGIN
- **Value**: Your frontend URL (from Netlify or anywhere)
- **Examples**: 
  - `https://my-app.netlify.app`
  - `https://example.com`
  - `http://localhost:3100` (local only)
- **Purpose**: Allows frontend to make requests to backend
- **Multiple Origins**: Separate with commas
  - `https://my-app.netlify.app,https://staging.netlify.app`
- **Why**: Security - prevents CORS errors

## How to Set Variables on Render

### Method 1: Using render.json (Automatic)

The `render.json` file automatically configures variables:

```json
{
  "services": [
    {
      "envVars": [
        {"key": "NODE_ENV", "value": "production"},
        {"key": "JWT_SECRET", "sync": false},
        {"key": "DATABASE_URL", "fromDatabase": {...}}
      ]
    }
  ]
}
```

Variables marked `"sync": false` must be set manually on dashboard.

### Method 2: Manual Setup on Render Dashboard

1. Go to Render Dashboard
2. Click on your service ("core-backend")
3. Click "Environment"
4. Add each variable:
   - Key: `NODE_ENV`
   - Value: `production`
   - Click "Add"
5. Repeat for JWT_SECRET, CORS_ORIGIN, etc.

### Method 3: Copy from File

After deployment, you can view all set variables in Environment tab.

## Optional Variables

### NODE_OPTIONS (Performance)
```
--max-old-space-size=512
```
- Limits memory usage on free tier
- Only add if running out of memory

### LOG_LEVEL (Debugging)
```
debug
```
- Values: error, warn, info, debug
- `debug` = more verbose logging
- Useful for troubleshooting

## PostgreSQL Connection String

When Render creates a PostgreSQL database, it provides a URL like:

```
postgresql://postgres:AbCdEfGh@pg-abcd1234-a.render.com:5432/core_db
```

Break down:
- `postgresql://` - Protocol
- `postgres` - Username
- `AbCdEfGh` - Password
- `pg-abcd1234-a.render.com` - Host
- `5432` - Port (standard PostgreSQL)
- `core_db` - Database name

This is automatically set when using render.json.

## Best Practices

1. **JWT_SECRET**
   - Generate strong random: `openssl rand -hex 32`
   - Change regularly
   - Never share or commit

2. **CORS_ORIGIN**
   - Use HTTPS URLs in production
   - Match your frontend domain exactly
   - Include port if non-standard

3. **DATABASE_URL**
   - Never share with others
   - Rotate credentials periodically
   - Use strong passwords

4. **NODE_ENV**
   - Always `production` on Render
   - Always `development` locally

## Deployment Checklist

- [ ] JWT_SECRET is set to a strong random value
- [ ] CORS_ORIGIN matches your frontend URL
- [ ] DATABASE_URL is properly configured
- [ ] NODE_ENV is set to `production`
- [ ] PORT is set to 3100
- [ ] PostgreSQL database is created
- [ ] Database migration ran successfully
- [ ] Backend service is in "Live" state

## Troubleshooting

### "DATABASE_CONNECTION_ERROR"
- Check DATABASE_URL is correct
- Verify PostgreSQL service is running
- Check database credentials

### "CORS Error" in Browser
- Verify CORS_ORIGIN matches your frontend URL exactly
- Include full domain: `https://example.netlify.app`
- Check for trailing slashes

### "Invalid Token"
- JWT_SECRET might have changed
- All backend instances must use same JWT_SECRET
- Clear browser cookies and re-login

### "Port Already in Use"
- Render automatically assigns available port
- Check that PORT variable is set to 3100
- Service restarts if port conflicts

## Viewing Logs

To check if variables are loaded correctly:

1. Go to service on Render
2. Click "Logs"
3. Look for startup messages showing port and environment

Example good logs:
```
Core server running on http://localhost:3100
NODE_ENV: production
JWT configured
PostgreSQL connected
```

Example bad logs:
```
Cannot connect to database
Missing JWT_SECRET
CORS blocked
```

## Advanced: Secrets Management

For enterprise setups:

1. Use Render's secrets manager instead of typing values
2. Rotate secrets regularly
3. Audit who has access to variables
4. Use different secrets for staging vs production

See Render docs: https://render.com/docs/environment-variables
