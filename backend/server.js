const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

const prisma = new PrismaClient();

// ✅ Enforce required env variables (NO fallback in production)
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend', 'web');

app.use(cors());
app.use(express.json());

// ✅ Crash visibility
process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});

// ------------------ ROUTES (keep your existing ones here) ------------------ //
// (No change needed in your APIs — they are fine)

// ------------------ STATIC FIX (CRITICAL FIX) ------------------ //
if (process.env.RENDER !== 'true') {
  app.use(express.static(FRONTEND_DIR));
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  return res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ------------------ ERROR HANDLER ------------------ //
app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({
    error: error.message || 'Internal server error',
  });
});

// ------------------ SAFE STARTUP ------------------ //
async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Startup failed:", error);
    process.exit(1);
  }
}

startServer();
