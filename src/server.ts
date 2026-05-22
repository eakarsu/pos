import { server, app } from './app';
import { config } from './config/environment';
import { logger } from './utils/logger';
import gapFeaturesRouter from './routes/gap-features'; // === Batch 11 Gaps & Frontend Mounts ===

app.use('/api', gapFeaturesRouter); // === Batch 11 Gaps & Frontend Mounts ===

const PORT = config.port || 3000;

async function startServer() {
  try {
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
