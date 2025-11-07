/**
 * Clock Port
 * Interface for time-related operations (useful for testing)
 */
class Clock {
  /**
   * Get current date/time
   * @returns {Date}
   */
  now() {
    throw new Error('Method not implemented');
  }
}

module.exports = Clock;
