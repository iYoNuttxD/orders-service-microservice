const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const container = require('./container');
const createOrdersRouter = require('../features/orders/http/router');
const { createSystemRouter, metricsMiddleware } = require('../features/system/http/handlers');
const errorHandler = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

// Legacy routes (for backward compatibility)
const clientesRoutes = require('../routes/clientes.routes');
const restaurantesRoutes = require('../routes/restaurantes.routes');
const cardapiosRoutes = require('../routes/cardapios.routes');
const avaliacoesRoutes = require('../routes/avaliacoes.routes');
const pagamentosRoutes = require('../routes/pagamentos.routes');

/**
 * Connect to MongoDB with retry logic
 */
async function connectDB(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const options = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(process.env.MONGODB_URI, options);
      
      logger.info('✅ Connected to MongoDB Atlas');
      return true;
    } catch (error) {
      logger.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed`, {
        error: error.message
      });
      
      if (i < retries - 1) {
        logger.info(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  logger.error('❌ Failed to connect to MongoDB after all retries');
  return false;
}

/**
 * Create and configure Express app
 */
function createApp() {
  const app = express();

  // Security & CORS
  app.use(helmet({
    contentSecurityPolicy: false // Allow Swagger UI to work
  }));
  app.use(cors());
  
  // Body parsing with size limits
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  
  // Logging
  app.use(morgan('combined', { 
    stream: { write: message => logger.info(message.trim()) }
  }));

  // Metrics middleware
  if (process.env.METRICS_ENABLED !== 'false') {
    app.use(metricsMiddleware);
  }

  // Swagger Documentation
  try {
    const swaggerDocument = YAML.load(path.join(__dirname, '../../openapi.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'Orders Service API Docs',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      }
    }));
  } catch (error) {
    logger.warn('Failed to load Swagger documentation', { error: error.message });
  }

  // System routes (health & metrics)
  const systemHandlers = container.getSystemHandlers();
  const systemRouter = createSystemRouter(systemHandlers);
  app.use('/api/v1', systemRouter);

  // Orders routes (new clean architecture)
  const ordersHandlers = container.getOrdersHandlers();
  const ordersRouter = createOrdersRouter(ordersHandlers);
  app.use('/api/v1/pedidos', ordersRouter);

  // Legacy routes (backward compatibility)
  app.use('/api/v1/clientes', clientesRoutes);
  app.use('/api/v1/restaurantes', restaurantesRoutes);
  app.use('/api/v1/cardapios', cardapiosRoutes);
  app.use('/api/v1/avaliacoes', avaliacoesRoutes);
  app.use('/api/v1/pagamentos', pagamentosRoutes);

  // Root route
  app.get('/', (req, res) => {
    res.json({
      message: 'Orders Service API',
      version: '1.0.0',
      database: 'MongoDB Atlas',
      endpoints: {
        health: '/api/v1/health',
        metrics: '/api/v1/metrics',
        docs: '/api-docs',
        orders: '/api/v1/pedidos',
        clientes: '/api/v1/clientes',
        restaurantes: '/api/v1/restaurantes',
        cardapios: '/api/v1/cardapios',
        avaliacoes: '/api/v1/avaliacoes',
        pagamentos: '/api/v1/pagamentos'
      }
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server (Azure-ready)
 */
async function startServer() {
  const app = createApp();
  const PORT = process.env.PORT || 3002;
  const HOST = '0.0.0.0'; // Azure requires 0.0.0.0

  try {
    // Connect to MongoDB (non-blocking for other services)
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
      logger.warn('⚠️  Starting server without database connection');
      logger.warn('⚠️  Some features may not work correctly');
    }

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Orders Service running on ${HOST}:${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 MongoDB: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      logger.info(`📄 API Docs: http://localhost:${PORT}/api-docs`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`⚠️  ${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        try {
          // Close MongoDB connection
          if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            logger.info('✅ MongoDB connection closed');
          }
          
          // Close message bus
          await container.close();
          logger.info('✅ Container cleaned up');
          
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: error.message });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors (log but don't exit)
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { 
        error: error.message,
        stack: error.stack 
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { 
        reason,
        promise 
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server', { 
      error: error.message,
      stack: error.stack 
    });
    // Log error but don't call process.exit - let Azure handle restart
    throw error;
  }
}

// Export app for testing
const app = createApp();
module.exports = app;
module.exports.startServer = startServer;

// Start server only if run directly or through legacy app.js
if (require.main === module || require.main.filename.endsWith('/src/app.js')) {
  startServer();
}
