const logger = require('../../../utils/logger');

/**
 * ListOrders Use Case
 * Retrieves a list of orders with optional filters
 */
class ListOrders {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute(filters = {}) {
    try {
      logger.info('Listing orders', { filters });
      
      const orders = await this.orderRepository.findAll(filters);
      
      return orders;
    } catch (error) {
      logger.error('Error listing orders', { error: error.message });
      throw error;
    }
  }
}

module.exports = ListOrders;
