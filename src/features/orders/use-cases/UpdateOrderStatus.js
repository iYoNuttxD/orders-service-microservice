const logger = require('../../../utils/logger');

/**
 * UpdateOrderStatus Use Case
 * Updates the status of an order with validation
 */
class UpdateOrderStatus {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute({ orderId, status }) {
    try {
      logger.info('Updating order status', { orderId, status });
      
      // Get order
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        const error = new Error('Pedido não encontrado');
        error.statusCode = 404;
        throw error;
      }

      // Validate status transition
      if (!order.canTransitionTo(status)) {
        const error = new Error(`Transição inválida de ${order.status} para ${status}`);
        error.statusCode = 400;
        throw error;
      }

      // Update status
      const updatedOrder = await this.orderRepository.updateStatus(orderId, status);
      
      logger.info('Order status updated successfully', { orderId, status });

      return updatedOrder;
    } catch (error) {
      logger.error('Error updating order status', { 
        orderId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = UpdateOrderStatus;
