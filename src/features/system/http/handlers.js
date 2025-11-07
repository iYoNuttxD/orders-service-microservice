const express = require('express');
const { register, collectDefaultMetrics, Counter, Histogram } = require('prom-client');

// Initialize default metrics
collectDefaultMetrics({ prefix: 'orders_service_' });

// Custom metrics
const ordersCreatedCounter = new Counter({
  name: 'orders_service_orders_created_total',
  help: 'Total number of orders created'
});

const ordersPaidCounter = new Counter({
  name: 'orders_service_orders_paid_total',
  help: 'Total number of orders paid'
});

const ordersCanceledCounter = new Counter({
  name: 'orders_service_orders_canceled_total',
  help: 'Total number of orders canceled'
});

const httpRequestDuration = new Histogram({
  name: 'orders_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

/**
 * System Handlers
 * Handles health checks and metrics
 */
class SystemHandlers {
  constructor({ orderRepository, messageBus, policyClient, paymentGateway }) {
    this.orderRepository = orderRepository;
    this.messageBus = messageBus;
    this.policyClient = policyClient;
    this.paymentGateway = paymentGateway;
  }

  async handleHealth(req, res) {
    try {
      const [natsStatus, opaStatus, paymentStatus] = await Promise.all([
        this.messageBus.getStatus(),
        this.policyClient.getStatus(),
        this.paymentGateway.getStatus()
      ]);

      const overallStatus = 
        (natsStatus.status === 'disabled' || natsStatus.status === 'healthy') &&
        (opaStatus.status === 'disabled' || opaStatus.status === 'healthy') &&
        (paymentStatus.status === 'disabled' || paymentStatus.status === 'healthy')
          ? 'UP' : 'DEGRADED';

      res.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        service: 'Orders Service',
        version: '1.0.0',
        database: 'MongoDB Atlas',
        integrations: {
          nats: natsStatus,
          opa: opaStatus,
          payment: paymentStatus
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  handleMetrics(req, res) {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
  }
}

/**
 * Middleware to track HTTP request metrics
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
}

/**
 * Create system router
 */
function createSystemRouter(handlers) {
  const router = express.Router();

  router.get('/health', (req, res) => handlers.handleHealth(req, res));
  router.get('/metrics', (req, res) => handlers.handleMetrics(req, res));

  return router;
}

module.exports = {
  SystemHandlers,
  createSystemRouter,
  metricsMiddleware,
  metrics: {
    ordersCreatedCounter,
    ordersPaidCounter,
    ordersCanceledCounter
  }
};
