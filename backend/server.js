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

// ================== CONFIG ==================

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend', 'web');

// ================== REQUIRED ENV CHECK ==================

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// ================== CORS FIX (CRITICAL) ==================

app.use(cors({
  origin: [
    "https://your-netlify-app.netlify.app", // 🔁 replace with your real Netlify URL
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// ================== MIDDLEWARE ==================

app.use(express.json());

// ================== SOCKET.IO ==================

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ================== HEALTH ROUTE ==================

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ================== HELPERS ==================

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function asyncHandler(handler) {
  return (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ================== AUTH ==================

app.post('/api/auth/register',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const displayName = String(req.body.displayName || '').trim();

    if (!email || !password || !displayName) {
      throw httpError(400, 'All fields required');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw httpError(400, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, displayName }
    });

    res.status(201).json({
      token: signToken(user),
      user: sanitizeUser(user)
    });
  })
);

app.post('/api/auth/login',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw httpError(401, 'Invalid credentials');
    }

    res.json({
      token: signToken(user),
      user: sanitizeUser(user)
    });
  })
);

// ================== STATIC FIX (IMPORTANT) ==================

if (process.env.RENDER !== 'true') {
  app.use(express.static(FRONTEND_DIR));
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  return res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ================== ERROR HANDLER ==================

app.use((error, req, res, next) => {
  const status = error.status || 500;
  console.error(error);
  res.status(status).json({
    error: error.message || 'Internal server error',
  });
});

// ================== START SERVER ==================

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
