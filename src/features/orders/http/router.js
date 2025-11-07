const express = require('express');

/**
 * Orders Router
 * Defines HTTP routes for orders feature
 */
function createOrdersRouter(handlers) {
  const router = express.Router();

  // List orders with filters
  router.get('/', (req, res, next) => handlers.handleList(req, res, next));
  
  // Get dashboard statistics
  router.get('/dashboard', (req, res, next) => handlers.handleDashboard(req, res, next));
  
  // Get order by ID
  router.get('/:id', (req, res, next) => handlers.handleGetById(req, res, next));
  
  // Create new order
  router.post('/', (req, res, next) => handlers.handleCreate(req, res, next));
  
  // Pay for order
  router.post('/:id/pay', (req, res, next) => handlers.handlePay(req, res, next));
  
  // Cancel order
  router.patch('/:id/cancelar', (req, res, next) => handlers.handleCancel(req, res, next));
  
  // Update order status
  router.patch('/:id/status', (req, res, next) => handlers.handleUpdateStatus(req, res, next));

  return router;
}

module.exports = createOrdersRouter;
