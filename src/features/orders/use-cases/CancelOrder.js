const OrderCanceled = require('../../../domain/events/OrderCanceled');
const logger = require('../../../utils/logger');

/**
 * CancelOrder Use Case
 * Cancels an order and publishes event
 */
class CancelOrder {
  constructor({ orderRepository, messageBus, policyClient }) {
    this.orderRepository = orderRepository;
    this.messageBus = messageBus;
    this.policyClient = policyClient;
  }

  async execute({ orderId, reason, canceledBy }) {
    try {
      logger.info('Canceling order', { orderId, reason, canceledBy });
      
      // Get order
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        const error = new Error('Pedido não encontrado');
        error.statusCode = 404;
        throw error;
      }

      // Authorize if policy client is enabled
      if (this.policyClient.isEnabled()) {
        const authResult = await this.policyClient.authorize({
          action: 'cancel_order',
          resource: { 
            type: 'order', 
            id: orderId, 
            status: order.status,
            clienteId: order.clienteId 
          },
          subject: { id: canceledBy, type: 'user' }
        });

        if (!authResult.allowed) {
          const error = new Error('Not authorized to cancel order');
          error.statusCode = 403;
          error.reason = authResult.reason;
          throw error;
        }
      }

      // Check if order can be canceled
      if (!order.canBeCanceled()) {
        const error = new Error('Pedido não pode ser cancelado');
        error.statusCode = 400;
        throw error;
      }

      // Update status to CANCELADO
      const updatedOrder = await this.orderRepository.updateStatus(orderId, 'CANCELADO');
      
      logger.info('Order canceled successfully', { orderId });

      // Publish OrderCanceled event
      if (this.messageBus.isEnabled()) {
        const event = new OrderCanceled({
          orderId: updatedOrder.id,
          numero: updatedOrder.numero,
          reason,
          canceledBy
        });

        await this.messageBus.publish('order.canceled', event.toPrimitives());
      }

      return updatedOrder;
    } catch (error) {
      logger.error('Error canceling order', { 
        orderId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = CancelOrder;
