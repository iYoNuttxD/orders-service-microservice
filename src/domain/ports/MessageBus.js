/**
 * MessageBus Port
 * Interface for message publishing and subscription
 */
class MessageBus {
  /**
   * Publish an event
   * @param {string} subject - Message subject/topic
   * @param {Object} data - Event data
   * @returns {Promise<void>}
   */
  async publish(subject, data) {
    throw new Error('Method not implemented');
  }

  /**
   * Subscribe to a subject
   * @param {string} subject - Subject to subscribe to
   * @param {Function} handler - Message handler function
   * @returns {Promise<Object>} Subscription object
   */
  async subscribe(subject, handler) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if message bus is enabled
   * @returns {boolean}
   */
  isEnabled() {
    throw new Error('Method not implemented');
  }

  /**
   * Get health status of message bus
   * @returns {Promise<Object>}
   */
  async getStatus() {
    throw new Error('Method not implemented');
  }

  /**
   * Close the connection
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('Method not implemented');
  }
}

module.exports = MessageBus;
