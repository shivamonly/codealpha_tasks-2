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
const JWT_SECRET = process.env.JWT_SECRET || 'core_super_secret_jwt_key_12345';
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'syncboard_frontend', 'web');

const publicUserSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
};

const projectInclude = {
  members: {
    include: {
      user: {
        select: publicUserSelect,
      },
    },
  },
};

const allowedPriorities = new Set(['LOW', 'MEDIUM', 'HIGH']);

app.use(cors());
app.use(express.json());

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
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
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function normalizePriority(priority, fallback = 'MEDIUM') {
  const nextPriority = String(priority || fallback).toUpperCase();
  return allowedPriorities.has(nextPriority) ? nextPriority : fallback;
}

function parseAssigneeIds(value) {
  if (!value) return [];
  return [
    ...new Set(
      String(value)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
}

async function validProjectAssigneeIds(projectId, assigneeValue) {
  const ids = parseAssigneeIds(assigneeValue);
  if (ids.length === 0) return [];

  const memberships = await prisma.projectMember.findMany({
    where: {
      projectId,
      userId: { in: ids },
    },
    select: { userId: true },
  });

  return memberships.map((member) => member.userId);
}

async function createNotification({ userId, type, content, projectId = null, taskId = null }) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      content,
      projectId,
      taskId,
    },
  });

  io.to(`user:${userId}`).emit('notification:new', notification);
  return notification;
}

async function createNotificationsForUsers(userIds, notificationData, exceptUserId) {
  const uniqueUserIds = [...new Set(userIds)].filter((id) => id && id !== exceptUserId);

  await Promise.all(
    uniqueUserIds.map((userId) =>
      createNotification({
        ...notificationData,
        userId,
      }),
    ),
  );
}

async function ensureProjectMember(userId, projectId) {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!member) {
    throw httpError(403, 'Not authorized for this project');
  }

  return member;
}

async function ensureProjectOwner(userId, projectId) {
  const member = await ensureProjectMember(userId, projectId);

  if (member.role !== 'OWNER') {
    throw httpError(403, 'Only the project owner can perform this action');
  }

  return member;
}

async function findColumnForUser(columnId, userId) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { project: true },
  });

  if (!column) {
    throw httpError(404, 'Column not found');
  }

  await ensureProjectMember(userId, column.projectId);
  return column;
}

async function findTaskForUser(taskId, userId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      column: true,
    },
  });

  if (!task) {
    throw httpError(404, 'Task not found');
  }

  await ensureProjectMember(userId, task.column.projectId);
  return task;
}

async function reorderTask(existingTask, targetColumnId, targetOrder, updateData = {}) {
  const normalizedOrder = Number.isInteger(Number(targetOrder))
    ? Number(targetOrder)
    : existingTask.order;
  const movingAcrossColumns = existingTask.columnId !== targetColumnId;

  return prisma.$transaction(async (tx) => {
    const sourceTasks = await tx.task.findMany({
      where: {
        columnId: existingTask.columnId,
        NOT: { id: existingTask.id },
      },
      orderBy: { order: 'asc' },
    });

    const targetTasks = movingAcrossColumns
      ? await tx.task.findMany({
          where: {
            columnId: targetColumnId,
            NOT: { id: existingTask.id },
          },
          orderBy: { order: 'asc' },
        })
      : [...sourceTasks];

    const targetIndex = Math.max(0, Math.min(normalizedOrder, targetTasks.length));
    targetTasks.splice(targetIndex, 0, existingTask);

    if (movingAcrossColumns) {
      await Promise.all(
        sourceTasks.map((task, index) =>
          tx.task.update({
            where: { id: task.id },
            data: { order: index },
          }),
        ),
      );
    }

    await Promise.all(
      targetTasks.map((task, index) =>
        tx.task.update({
          where: { id: task.id },
          data: {
            ...(task.id === existingTask.id ? updateData : {}),
            columnId: targetColumnId,
            order: index,
          },
        }),
      ),
    );

    return tx.task.findUnique({
      where: { id: existingTask.id },
    });
  });
}

function getTokenFromSocket(socket) {
  const authToken = socket.handshake.auth && socket.handshake.auth.token;
  if (authToken) return authToken;

  const queryToken = socket.handshake.query && socket.handshake.query.token;
  if (queryToken) return queryToken;

  const header = socket.handshake.headers.authorization;
  return header && header.startsWith('Bearer ') ? header.slice(7) : null;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
}

// Auth
app.post(
  '/api/auth/register',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const displayName = String(req.body.displayName || '').trim();
    const avatarUrl = req.body.avatarUrl || null;

    if (!email || !password || !displayName) {
      throw httpError(400, 'Email, password, and display name are required');
    }

    if (password.length < 6) {
      throw httpError(400, 'Password must be at least 6 characters');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw httpError(400, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        avatarUrl,
      },
    });

    res.status(201).json({
      token: signToken(user),
      user: sanitizeUser(user),
    });
  }),
);

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      throw httpError(400, 'Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw httpError(401, 'Invalid email or password');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw httpError(401, 'Invalid email or password');
    }

    res.json({
      token: signToken(user),
      user: sanitizeUser(user),
    });
  }),
);

// Projects
app.get(
  '/api/projects',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: projectInclude,
        },
      },
      orderBy: {
        project: {
          createdAt: 'desc',
        },
      },
    });

    res.json(memberships.map((membership) => membership.project));
  }),
);

app.post(
  '/api/projects',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const description = req.body.description ? String(req.body.description).trim() : null;

    if (!name) {
      throw httpError(400, 'Project name is required');
    }

    const project = await prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          name,
          description,
          ownerId: req.user.id,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: createdProject.id,
          userId: req.user.id,
          role: 'OWNER',
        },
      });

      const defaultColumns = ['To Do', 'In Progress', 'In Review', 'Done'];
      await Promise.all(
        defaultColumns.map((columnName, index) =>
          tx.column.create({
            data: {
              name: columnName,
              order: index,
              projectId: createdProject.id,
            },
          }),
        ),
      );

      return tx.project.findUnique({
        where: { id: createdProject.id },
        include: projectInclude,
      });
    });

    res.status(201).json(project);
  }),
);

app.post(
  '/api/projects/:id/invite',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const email = normalizeEmail(req.body.email);

    if (!email) {
      throw httpError(400, 'Email is required');
    }

    await ensureProjectOwner(req.user.id, projectId);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      throw httpError(404, 'User with this email not found');
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw httpError(400, 'User is already a member of this project');
    }

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: 'COLLABORATOR',
      },
    });

    await createNotification({
      userId: targetUser.id,
      type: 'INVITE',
      content: `You were invited to "${project.name}".`,
      projectId,
    });

    io.to(`project:${projectId}`).emit('project:members-updated', {
      projectId,
      user: sanitizeUser(targetUser),
    });

    res.json(sanitizeUser(targetUser));
  }),
);

// Board, columns, and tasks
app.get(
  '/api/projects/:id/tasks',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    await ensureProjectMember(req.user.id, projectId);

    const columns = await prisma.column.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json(columns);
  }),
);

app.post(
  '/api/projects/:projectId/columns',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const name = String(req.body.name || '').trim();

    if (!name) {
      throw httpError(400, 'Column name is required');
    }

    await ensureProjectMember(req.user.id, projectId);

    const columnsCount = await prisma.column.count({ where: { projectId } });
    const column = await prisma.column.create({
      data: {
        name,
        order: columnsCount,
        projectId,
      },
      include: { tasks: true },
    });

    io.to(`project:${projectId}`).emit('board:refresh', { projectId, reason: 'column:create' });
    res.status(201).json(column);
  }),
);

app.patch(
  '/api/columns/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const columnId = req.params.id;
    const name = String(req.body.name || '').trim();

    if (!name) {
      throw httpError(400, 'Column name is required');
    }

    const existingColumn = await findColumnForUser(columnId, req.user.id);
    const column = await prisma.column.update({
      where: { id: columnId },
      data: { name },
      include: { tasks: true },
    });

    io.to(`project:${existingColumn.projectId}`).emit('board:refresh', {
      projectId: existingColumn.projectId,
      reason: 'column:update',
    });
    res.json(column);
  }),
);

app.delete(
  '/api/columns/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const columnId = req.params.id;
    const column = await findColumnForUser(columnId, req.user.id);

    await prisma.column.delete({ where: { id: columnId } });
    io.to(`project:${column.projectId}`).emit('board:refresh', {
      projectId: column.projectId,
      reason: 'column:delete',
    });

    res.json({ message: 'Column deleted successfully' });
  }),
);

app.post(
  '/api/tasks',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const title = String(req.body.title || '').trim();
    const description = req.body.description ? String(req.body.description).trim() : null;
    const priority = normalizePriority(req.body.priority);
    const columnId = req.body.columnId;
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;

    if (!title || !columnId) {
      throw httpError(400, 'Title and columnId are required');
    }

    const column = await findColumnForUser(columnId, req.user.id);
    const assigneeIds = await validProjectAssigneeIds(column.projectId, req.body.assignees);
    const tasksCount = await prisma.task.count({ where: { columnId } });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        columnId,
        order: tasksCount,
        dueDate,
        assignees: assigneeIds.join(','),
      },
    });

    await createNotificationsForUsers(
      assigneeIds,
      {
        type: 'ASSIGNED',
        content: `You were assigned to "${task.title}".`,
        projectId: column.projectId,
        taskId: task.id,
      },
      req.user.id,
    );

    io.to(`project:${column.projectId}`).emit('board:refresh', {
      projectId: column.projectId,
      reason: 'task:create',
    });

    res.status(201).json(task);
  }),
);

app.patch(
  '/api/tasks/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const existingTask = await findTaskForUser(taskId, req.user.id);
    const projectId = existingTask.column.projectId;

    let targetColumnId = req.body.columnId || existingTask.columnId;
    if (req.body.columnId) {
      const targetColumn = await findColumnForUser(req.body.columnId, req.user.id);
      if (targetColumn.projectId !== projectId) {
        throw httpError(400, 'Tasks can only move within the same project');
      }
    }

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = String(req.body.title).trim();
    if (req.body.description !== undefined) {
      updateData.description = req.body.description ? String(req.body.description).trim() : null;
    }
    if (req.body.priority !== undefined) updateData.priority = normalizePriority(req.body.priority, existingTask.priority);
    if (req.body.dueDate !== undefined) {
      updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }

    let nextAssigneeIds = parseAssigneeIds(existingTask.assignees);
    let addedAssigneeIds = [];
    if (req.body.assignees !== undefined) {
      nextAssigneeIds = await validProjectAssigneeIds(projectId, req.body.assignees);
      const previousAssigneeIds = new Set(parseAssigneeIds(existingTask.assignees));
      addedAssigneeIds = nextAssigneeIds.filter((id) => !previousAssigneeIds.has(id));
      updateData.assignees = nextAssigneeIds.join(',');
    }

    const moveRequested = req.body.columnId !== undefined || req.body.order !== undefined;
    const targetOrder = req.body.order !== undefined ? req.body.order : existingTask.order;
    const movedAcrossColumns = targetColumnId !== existingTask.columnId;
    let task;

    if (moveRequested) {
      task = await reorderTask(existingTask, targetColumnId, targetOrder, updateData);
    } else {
      task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
      });
    }

    if (movedAcrossColumns) {
      const targetColumn = await prisma.column.findUnique({ where: { id: targetColumnId } });
      await prisma.activityLog.create({
        data: {
          content: `moved this card from ${existingTask.column.name} to ${targetColumn.name}`,
          taskId,
          userId: req.user.id,
        },
      });
    }

    await createNotificationsForUsers(
      addedAssigneeIds,
      {
        type: 'ASSIGNED',
        content: `You were assigned to "${task.title}".`,
        projectId,
        taskId: task.id,
      },
      req.user.id,
    );

    io.to(`project:${projectId}`).emit('board:refresh', {
      projectId,
      reason: movedAcrossColumns ? 'task:move' : 'task:update',
      taskId,
    });

    res.json(task);
  }),
);

app.delete(
  '/api/tasks/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const task = await findTaskForUser(taskId, req.user.id);
    const projectId = task.column.projectId;

    await prisma.task.delete({ where: { id: taskId } });
    io.to(`project:${projectId}`).emit('board:refresh', {
      projectId,
      reason: 'task:delete',
      taskId,
    });

    res.json({ message: 'Task deleted successfully' });
  }),
);

app.get(
  '/api/tasks/:id/details',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    await findTaskForUser(taskId, req.user.id);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: publicUserSelect,
            },
          },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, displayName: true },
            },
          },
        },
      },
    });

    res.json(task);
  }),
);

app.post(
  '/api/tasks/:id/comments',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const content = String(req.body.content || '').trim();

    if (!content) {
      throw httpError(400, 'Comment content is required');
    }

    const task = await findTaskForUser(taskId, req.user.id);
    const projectId = task.column.projectId;

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: publicUserSelect,
        },
      },
    });

    const assigneeIds = parseAssigneeIds(task.assignees);
    await createNotificationsForUsers(
      assigneeIds,
      {
        type: 'COMMENT',
        content: `${comment.author.displayName} commented on "${task.title}".`,
        projectId,
        taskId,
      },
      req.user.id,
    );

    io.to(`project:${projectId}`).emit('comment:added', {
      projectId,
      taskId,
      comment,
    });

    res.status(201).json(comment);
  }),
);

// Notifications
app.get(
  '/api/notifications',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(notifications);
  }),
);

app.patch(
  '/api/notifications/read',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.json({ message: 'Notifications marked as read' });
  }),
);

app.delete(
  '/api/notifications',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await prisma.notification.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    res.json({ message: 'Notifications cleared' });
  }),
);

// Socket.io real-time layer
io.on('connection', (socket) => {
  const token = getTokenFromSocket(socket);

  if (token) {
    try {
      socket.data.user = jwt.verify(token, JWT_SECRET);
      socket.join(`user:${socket.data.user.id}`);
    } catch (error) {
      socket.data.user = null;
    }
  }

  console.log('Client connected:', socket.id);

  socket.on('join', async (projectId) => {
    try {
      if (!socket.data.user) return;
      await ensureProjectMember(socket.data.user.id, projectId);
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined room project:${projectId}`);
    } catch (error) {
      socket.emit('socket:error', { message: error.message });
    }
  });

  socket.on('task:move', async (data) => {
    try {
      if (!socket.data.user) return;
      await ensureProjectMember(socket.data.user.id, data.projectId);
      socket.to(`project:${data.projectId}`).emit('task:moved', data);
    } catch (error) {
      socket.emit('socket:error', { message: error.message });
    }
  });

  socket.on('comment:new', async (data) => {
    try {
      if (!socket.data.user) return;
      await ensureProjectMember(socket.data.user.id, data.projectId);
      socket.to(`project:${data.projectId}`).emit('comment:added', data);
    } catch (error) {
      socket.emit('socket:error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(express.static(FRONTEND_DIR));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }

  return res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error: error.message || 'Internal server error',
  });
});

server.listen(PORT, () => {
  console.log(`Core server running on http://localhost:${PORT}`);
});
