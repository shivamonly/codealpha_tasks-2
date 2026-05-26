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
const prisma = new PrismaClient();

// ================== ENV CHECK ==================

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

// ================== CORS (FIXED) ==================

app.use(cors({
  origin: [
    "https://corexd.netlify.app",   // ✅ your frontend
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Preflight handler (VERY IMPORTANT)
app.options("*", cors());

// ================== MIDDLEWARE ==================

app.use(express.json());

// ================== SOCKET ==================

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
  const err = new Error(message);
  err.status = status;
  return err;
}

function asyncHandler(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ================== AUTH ==================

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const displayName = String(req.body.displayName || '').trim();

  if (!email || !password || !displayName) {
    throw httpError(400, 'All fields required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw httpError(400, 'Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash, displayName }
  });

  res.status(201).json({
    token: signToken(user),
    user
  });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, 'Invalid credentials');
  }

  res.json({
    token: signToken(user),
    user
  });
}));

// ================== STATIC FIX ==================

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend', 'web');

if (process.env.RENDER !== 'true') {
  app.use(express.static(FRONTEND_DIR));
}

// ================== ERROR HANDLER ==================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ================== START ==================

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ DB Connected");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

startServer();
