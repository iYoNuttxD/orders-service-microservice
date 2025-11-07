/**
 * OrderRepository Port
 * Interface for order persistence operations
 */
class OrderRepository {
  /**
   * Find order by ID
   * @param {string} id - Order ID
   * @returns {Promise<Order|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find orders with filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Order[]>}
   */
  async findAll(filters) {
    throw new Error('Method not implemented');
  }

  /**
   * Create a new order
   * @param {Order} order - Order entity
   * @returns {Promise<Order>}
   */
  async create(order) {
    throw new Error('Method not implemented');
  }

  /**
   * Update order status
   * @param {string} id - Order ID
   * @param {string} status - New status
   * @returns {Promise<Order>}
   */
  async updateStatus(id, status) {
    throw new Error('Method not implemented');
  }

  /**
   * Count orders by status
   * @param {string} status - Order status
   * @returns {Promise<number>}
   */
  async countByStatus(status) {
    throw new Error('Method not implemented');
  }

  /**
   * Get total sales value
   * @returns {Promise<number>}
   */
  async getTotalVendas() {
    throw new Error('Method not implemented');
  }
}

module.exports = OrderRepository;
