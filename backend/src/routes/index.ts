import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import jobRoutes from './jobRoutes';
import applicationRoutes from './applicationRoutes';
import dashboardRoutes from './dashboardRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';
import swaggerRoutes from './swaggerRoutes';

const router = Router();

// Deep Health Check Endpoint
router.get('/health', async (_req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected || !mongoose.connection.db) {
      return res.status(503).json({
        success: false,
        data: {
          status: 'DOWN',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        },
        message: 'Database connection unavailable',
      });
    }

    // Ping Database
    await mongoose.connection.db.admin().ping();

    return res.status(200).json({
      success: true,
      data: {
        status: 'UP',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      message: 'Backend API service and database are healthy',
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      data: {
        status: 'DOWN',
        database: 'error',
        timestamp: new Date().toISOString(),
      },
      message: `Database ping failed: ${(error as Error).message}`,
    });
  }
});

// API Routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/docs', swaggerRoutes);

export default router;
