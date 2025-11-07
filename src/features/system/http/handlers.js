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

      // Normalizar caso algum adapter antigo retorne só { enabled: true }
      function normalize(s) {
        if (!s) return { status: 'disabled', message: 'No status object' };
        if (s.status) return s;
        // Stripe antigo: { enabled: true }
        return s.enabled
          ? { status: 'healthy', message: 'Payment gateway enabled (no detailed status)' }
          : { status: 'disabled', message: 'Payment gateway disabled (no detailed status)' };
      }

      const nats = normalize(natsStatus);
      const opa = normalize(opaStatus);
      const payment = normalize(paymentStatus);

      const overallStatus =
        ['healthy', 'disabled'].includes(nats.status) &&
        ['healthy', 'disabled'].includes(opa.status) &&
        ['healthy', 'disabled'].includes(payment.status)
          ? 'UP'
          : 'DEGRADED';

      res.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        service: 'Orders Service',
        version: '1.0.0',
        database: 'MongoDB Atlas',
        integrations: {
          nats,
          opa,
          payment
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

  async handleMetrics(req, res) {
    try {
      const metrics = await register.metrics();
      res.set('Content-Type', register.contentType);
      res.end(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
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

  router.get('/health', (req, res, next) => {
    handlers.handleHealth(req, res).catch(next);
  });
  
  router.get('/metrics', async (req, res, next) => {
    try {
      await handlers.handleMetrics(req, res);
    } catch (error) {
      next(error);
    }
  });

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
