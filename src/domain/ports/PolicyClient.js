/**
 * PolicyClient Port
 * Interface for authorization/policy checking operations
 */
class PolicyClient {
  /**
   * Authorize an action
   * @param {Object} input - Authorization input
   * @param {string} input.action - Action to authorize (e.g., 'create_order', 'cancel_order')
   * @param {Object} input.resource - Resource being accessed
   * @param {Object} input.subject - Subject performing the action
   * @returns {Promise<Object>} Authorization result with allowed boolean
   */
  async authorize(input) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if policy client is enabled
   * @returns {boolean}
   */
  isEnabled() {
    throw new Error('Method not implemented');
  }

  /**
   * Get health status of policy client
   * @returns {Promise<Object>}
   */
  async getStatus() {
    throw new Error('Method not implemented');
  }
}

module.exports = PolicyClient;
