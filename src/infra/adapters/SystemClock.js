const ClockPort = require('../../../domain/ports/Clock');

/**
 * SystemClock
 * Provides system time
 */
class SystemClock extends ClockPort {
  now() {
    return new Date();
  }
}

module.exports = SystemClock;
