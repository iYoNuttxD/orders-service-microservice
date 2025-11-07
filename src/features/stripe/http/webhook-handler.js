const logger = require('../../../utils/logger');

/**
 * Stripe Webhook Handler
 * Handles Stripe webhook events for payment status updates
 */
class StripeWebhookHandler {
  constructor({ orderRepository, stripe, webhookSecret }) {
    this.orderRepository = orderRepository;
    this.stripe = stripe;
    this.webhookSecret = webhookSecret;
  }

  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const rawBody = req.rawBody;

    let event;

    try {
      // Verify webhook signature if secret is provided
      if (this.webhookSecret && this.stripe) {
        try {
          event = this.stripe.webhooks.constructEvent(rawBody, sig, this.webhookSecret);
          logger.info('Stripe webhook signature verified', { eventType: event.type });
        } catch (err) {
          logger.error('Webhook signature verification failed', { error: err.message });
          return res.status(400).json({ error: 'Webhook signature verification failed' });
        }
      } else {
        // No secret configured - accept events but log warning
        if (!this.webhookSecret) {
          logger.warn('STRIPE_WEBHOOK_SECRET not configured - accepting webhook without verification (NOT RECOMMENDED FOR PRODUCTION)');
        }
        event = req.body;
      }

      logger.info('Processing Stripe webhook', { 
        eventId: event.id, 
        eventType: event.type 
      });

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;
        
        default:
          logger.info('Unhandled webhook event type', { eventType: event.type });
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Error processing webhook', { 
        error: error.message,
        stack: error.stack 
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      const orderId = this.extractOrderIdFromDescription(paymentIntent.description);
      
      if (!orderId) {
        logger.warn('Could not extract orderId from payment intent', { 
          paymentIntentId: paymentIntent.id,
          description: paymentIntent.description 
        });
        return;
      }

      logger.info('Payment intent succeeded', { 
        orderId, 
        paymentIntentId: paymentIntent.id 
      });

      const order = await this.orderRepository.findById(orderId);
      
      if (!order) {
        logger.warn('Order not found for payment intent', { orderId, paymentIntentId: paymentIntent.id });
        return;
      }

      // Idempotent: only update if not already paid
      if (order.status === 'PAGO' && order.paymentTransactionId === paymentIntent.id) {
        logger.info('Order already marked as paid (idempotent)', { orderId });
        return;
      }

      // Mark as paid
      if (order.canBePaid()) {
        order.markAsPaid({
          transactionId: paymentIntent.id,
          method: 'card',
          provider: 'stripe'
        });

        await this.orderRepository.update(order.id, order);

        logger.info('Order marked as paid from webhook', { 
          orderId, 
          transactionId: paymentIntent.id 
        });
      } else {
        logger.warn('Order cannot be paid from current status', { 
          orderId, 
          status: order.status 
        });
      }
    } catch (error) {
      logger.error('Error handling payment_intent.succeeded', { 
        error: error.message,
        paymentIntentId: paymentIntent.id 
      });
      throw error;
    }
  }

  async handlePaymentIntentFailed(paymentIntent) {
    try {
      const orderId = this.extractOrderIdFromDescription(paymentIntent.description);
      
      if (!orderId) {
        logger.warn('Could not extract orderId from payment intent', { 
          paymentIntentId: paymentIntent.id,
          description: paymentIntent.description 
        });
        return;
      }

      logger.info('Payment intent failed', { 
        orderId, 
        paymentIntentId: paymentIntent.id,
        lastPaymentError: paymentIntent.last_payment_error?.message 
      });

      const order = await this.orderRepository.findById(orderId);
      
      if (!order) {
        logger.warn('Order not found for failed payment', { orderId });
        return;
      }

      // Mark as failed payment if still in PENDENTE status
      if (order.status === 'PENDENTE') {
        try {
          order.markPaymentFailed();
          await this.orderRepository.update(order.id, order);
          logger.info('Order marked as FAILED_PAYMENT', { orderId });
        } catch (error) {
          logger.error('Could not mark order as failed payment', { 
            orderId, 
            error: error.message 
          });
        }
      }
    } catch (error) {
      logger.error('Error handling payment_intent.payment_failed', { 
        error: error.message,
        paymentIntentId: paymentIntent.id 
      });
      throw error;
    }
  }

  async handleChargeRefunded(charge) {
    try {
      const paymentIntentId = charge.payment_intent;
      
      if (!paymentIntentId) {
        logger.warn('No payment intent ID in charge.refunded event', { chargeId: charge.id });
        return;
      }

      logger.info('Charge refunded', { 
        chargeId: charge.id,
        paymentIntentId,
        refundId: charge.refunds?.data?.[0]?.id 
      });

      // Find order by payment transaction ID
      const orders = await this.orderRepository.findAll();
      const order = orders.find(o => o.paymentTransactionId === paymentIntentId);

      if (!order) {
        logger.warn('Order not found for refunded charge', { paymentIntentId });
        return;
      }

      // Mark as refunded (idempotent)
      if (!order.refundId) {
        const refundId = charge.refunds?.data?.[0]?.id || `refund_${charge.id}`;
        order.markAsRefunded({ refundId });
        await this.orderRepository.update(order.id, order);
        
        logger.info('Order marked as refunded', { 
          orderId: order.id, 
          refundId 
        });
      } else {
        logger.info('Order already marked as refunded (idempotent)', { orderId: order.id });
      }
    } catch (error) {
      logger.error('Error handling charge.refunded', { 
        error: error.message,
        chargeId: charge.id 
      });
      throw error;
    }
  }

  extractOrderIdFromDescription(description) {
    // Extract order ID from description like "Order 64abc123..."
    if (!description) return null;
    
    const match = description.match(/Order\s+([a-f0-9]{24})/i);
    return match ? match[1] : null;
  }
}

module.exports = StripeWebhookHandler;
