/**
 * PaymentGateway Port
 * Interface for payment processing operations
 */
class PaymentGateway {
  /**
   * Process a payment
   * @param {Object} paymentData - Payment information
   * @param {number} paymentData.amount - Amount to charge
   * @param {string} paymentData.method - Payment method
   * @param {string} paymentData.orderId - Order ID
   * @param {Object} paymentData.metadata - Additional metadata
   * @returns {Promise<Object>} Payment result with status and transactionId
   */
  async processPayment(paymentData) {
    throw new Error('Method not implemented');
  }

  /**
   * Refund a payment
   * @param {string} transactionId - Transaction ID to refund
   * @param {number} amount - Amount to refund
   * @returns {Promise<Object>} Refund result
   */
  async refund(transactionId, amount) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if payment gateway is enabled
   * @returns {boolean}
   */
  isEnabled() {
    throw new Error('Method not implemented');
  }

  /**
   * Get health status of payment gateway
   * @returns {Promise<Object>}
   */
  async getStatus() {
    throw new Error('Method not implemented');
  }
}

module.exports = PaymentGateway;
