const OrderPaid = require('../../../domain/events/OrderPaid');
const logger = require('../../../utils/logger');
const crypto = require('crypto');

/**
 * PayOrder Use Case
 * Processes payment for an order and publishes event
 */
class PayOrder {
  constructor({ orderRepository, paymentGateway, messageBus, metrics }) {
    this.orderRepository = orderRepository;
    this.paymentGateway = paymentGateway;
    this.messageBus = messageBus;
    this.metrics = metrics;
  }

  async execute({ orderId, paymentMethod, paymentData = {}, idempotencyKey }) {
    const startTime = Date.now();
    let provider = 'unknown';
    
    try {
      logger.info('Processing payment for order', { orderId, paymentMethod });
      
      // Get order
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        const error = new Error('Pedido não encontrado');
        error.statusCode = 404;
        throw error;
      }

      // Check if already paid
      if (order.paymentTransactionId && order.status === 'PAGO') {
        logger.info('Order already paid, returning existing payment', { 
          orderId, 
          transactionId: order.paymentTransactionId 
        });
        return {
          order,
          payment: {
            transactionId: order.paymentTransactionId,
            status: 'APPROVED',
            message: 'Payment already processed (idempotent)'
          }
        };
      }

      // Check if order can be paid
      if (!order.canBePaid()) {
        const error = new Error(`Pedido não pode ser pago no status ${order.status}`);
        error.statusCode = 400;
        throw error;
      }

      // Generate fallback idempotency key if not provided
      if (!idempotencyKey) {
        const hash = crypto.createHash('sha256')
          .update(`${orderId}:${order.numero}:${order.valorFinal}`)
          .digest('hex')
          .substring(0, 16);
        idempotencyKey = `order-${orderId}-${hash}`;
        logger.info('Generated fallback idempotency key', { orderId, idempotencyKey });
      }

      // Determine provider from gateway
      provider = this.paymentGateway.constructor.name === 'StripePaymentAdapter' ? 'stripe' : 'http';

      // Track payment attempt
      if (this.metrics?.paymentsAttemptCounter) {
        this.metrics.paymentsAttemptCounter.labels(provider).inc();
      }

      // Process payment
      const paymentResult = await this.paymentGateway.processPayment({
        amount: order.valorFinal,
        method: paymentMethod,
        orderId: order.id,
        idempotencyKey,
        metadata: {
          numero: order.numero,
          clienteId: order.clienteId,
          ...paymentData
        }
      });

      const latencySeconds = (Date.now() - startTime) / 1000;

      if (!paymentResult.success) {
        // Track failure
        if (this.metrics?.paymentsFailureCounter) {
          this.metrics.paymentsFailureCounter.labels(provider).inc();
        }
        if (this.metrics?.paymentLatencyHistogram) {
          this.metrics.paymentLatencyHistogram.labels(provider, 'failure').observe(latencySeconds);
        }

        const error = new Error(paymentResult.message || 'Payment failed');
        error.statusCode = 402; // Payment Required
        error.reason = paymentResult.reason;
        error.gatewayResponse = paymentResult.gatewayResponse;
        throw error;
      }

      // Track success
      if (this.metrics?.paymentsSuccessCounter) {
        this.metrics.paymentsSuccessCounter.labels(provider).inc();
      }
      if (this.metrics?.paymentLatencyHistogram) {
        this.metrics.paymentLatencyHistogram.labels(provider, 'success').observe(latencySeconds);
      }

      logger.info('Payment processed successfully', { 
        orderId, 
        transactionId: paymentResult.transactionId 
      });

      // Update order with payment metadata
      order.markAsPaid({
        transactionId: paymentResult.transactionId,
        method: paymentMethod,
        provider
      });

      // Save order with payment metadata
      await this.orderRepository.update(order.id, order);

      // Publish OrderPaid event
      if (this.messageBus.isEnabled()) {
        const event = new OrderPaid({
          orderId: order.id,
          numero: order.numero,
          amount: order.valorFinal,
          paymentMethod,
          transactionId: paymentResult.transactionId
        });

        await this.messageBus.publish('order.paid', event.toPrimitives());
      }

      return {
        order,
        payment: {
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          message: paymentResult.message
        }
      };
    } catch (error) {
      logger.error('Error processing payment', { 
        orderId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = PayOrder;
