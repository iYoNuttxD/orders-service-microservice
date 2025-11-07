const express = require('express');

/**
 * Stripe Webhook Router
 * Handles Stripe webhook events
 * Note: This route needs raw body for signature verification
 */
function createStripeWebhookRouter(webhookHandler) {
  const router = express.Router();

  // Webhook endpoint - signature verification requires raw body
  router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    // Store raw body for signature verification
    req.rawBody = req.body;
    
    // Parse body if needed (when raw middleware is used)
    if (Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(req.body.toString());
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    }

    await webhookHandler.handleWebhook(req, res);
  });

  return router;
}

module.exports = createStripeWebhookRouter;
