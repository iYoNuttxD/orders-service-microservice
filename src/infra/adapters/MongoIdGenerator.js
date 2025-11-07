const IdGeneratorPort = require('../../../domain/ports/IdGenerator');

/**
 * MongoIdGenerator
 * Generates MongoDB ObjectId-compatible IDs
 */
class MongoIdGenerator extends IdGeneratorPort {
  generate() {
    // Generate a simple unique ID (timestamp + random)
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return timestamp + random;
  }
}

module.exports = MongoIdGenerator;
