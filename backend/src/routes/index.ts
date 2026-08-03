import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import jobRoutes from './job.routes';
import applicationRoutes from './application.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';

const router = Router();

// API Health Check
router.get('/health', async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  let dbStatus = 'disconnected';
  
  if (isDbConnected) {
    try {
      // Ping the admin database to verify active connection
      await mongoose.connection.db!.admin().ping();
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'unhealthy';
    }
  }

  const healthy = isDbConnected && dbStatus === 'connected';

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'System is running smoothly.' : 'System is experiencing issues.',
    data: {
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
    error: healthy ? null : 'Database connection is offline or unhealthy',
  });
});

// Auth Module Routes
router.use('/auth', authRoutes);

// Profile Module Routes
router.use('/profile', profileRoutes);

// Job Module Routes
router.use('/jobs', jobRoutes);

// Application Module Routes
router.use('/applications', applicationRoutes);

// Dashboard Module Routes
router.use('/dashboard', dashboardRoutes);

// Notification Module Routes
router.use('/notifications', notificationRoutes);

// Admin Module Routes
router.use('/admin', adminRoutes);

export default router;
