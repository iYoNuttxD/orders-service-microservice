const logger = require('../../../utils/logger');

/**
 * GetOrder Use Case
 * Retrieves a single order by ID
 */
class GetOrder {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute(orderId) {
    try {
      logger.info('Getting order', { orderId });
      
      const order = await this.orderRepository.findById(orderId);
      
      if (!order) {
        const error = new Error('Pedido não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      return order;
    } catch (error) {
      logger.error('Error getting order', { orderId, error: error.message });
      throw error;
    }
  }
}

module.exports = GetOrder;
