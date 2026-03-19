require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB } = require('./src/config/database');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Routes
const authRoutes = require('./src/routes/auth');
const leadsRoutes = require('./src/routes/leads');
const meetingsRoutes = require('./src/routes/meetings');
const notificationsRoutes = require('./src/routes/notifications');
const usersRoutes = require('./src/routes/users');
const dashboardRoutes = require('./src/routes/dashboard');

const app = express();
const httpServer = http.createServer(app);

// ===================== SOCKET.IO =====================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

global.io = io;

io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ===================== MIDDLEWARE =====================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ===================== ROUTES =====================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Al Team CRM API is running 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ===================== ERROR HANDLING =====================
app.use(notFound);
app.use(errorHandler);

// ===================== START SERVER =====================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Run seeder on first start
  const { seedDatabase } = require('./src/seeders/initial');
  await seedDatabase();

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Al Team CRM Server running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`⚡ Socket.io: Enabled`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

startServer().catch(console.error);

