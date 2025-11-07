const OrderPaid = require('../../../domain/events/OrderPaid');
const logger = require('../../../utils/logger');

/**
 * PayOrder Use Case
 * Processes payment for an order and publishes event
 */
class PayOrder {
  constructor({ orderRepository, paymentGateway, messageBus }) {
    this.orderRepository = orderRepository;
    this.paymentGateway = paymentGateway;
    this.messageBus = messageBus;
  }

  async execute({ orderId, paymentMethod, paymentData = {} }) {
    try {
      logger.info('Processing payment for order', { orderId, paymentMethod });
      
      // Get order
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        const error = new Error('Pedido não encontrado');
        error.statusCode = 404;
        throw error;
      }

      // Check if order can be paid
      if (!order.canBePaid()) {
        const error = new Error(`Pedido não pode ser pago no status ${order.status}`);
        error.statusCode = 400;
        throw error;
      }

      // Process payment
      const paymentResult = await this.paymentGateway.processPayment({
        amount: order.valorFinal,
        method: paymentMethod,
        orderId: order.id,
        metadata: {
          numero: order.numero,
          clienteId: order.clienteId,
          ...paymentData
        }
      });

      if (!paymentResult.success) {
        const error = new Error(paymentResult.message || 'Payment failed');
        error.statusCode = 402; // Payment Required
        error.reason = paymentResult.reason;
        error.gatewayResponse = paymentResult.gatewayResponse;
        throw error;
      }

      logger.info('Payment processed successfully', { 
        orderId, 
        transactionId: paymentResult.transactionId 
      });

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
