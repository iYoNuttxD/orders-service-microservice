const { connect, StringCodec } = require('nats');
const MessageBusPort = require('../../domain/ports/MessageBus');
const logger = require('../../utils/logger');

/**
 * NatsMessageBus
 * Adapter for NATS messaging system
 */
class NatsMessageBus extends MessageBusPort {
  constructor({ url, timeout = 5000 }) {
    super();
    this.url = url;
    this.timeout = timeout;
    this.enabled = !!url;
    this.connection = null;
    this.codec = StringCodec();
    this.connecting = false;
  }

  isEnabled() {
    return this.enabled;
  }

  async _ensureConnection() {
    if (!this.enabled) {
      return;
    }

    if (this.connection && !this.connection.isClosed()) {
      return;
    }

    if (this.connecting) {
      // Wait for ongoing connection attempt
      let attempts = 0;
      while (this.connecting && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return;
    }

    try {
      this.connecting = true;
      logger.info('Connecting to NATS', { url: this.url });
      
      this.connection = await connect({
        servers: this.url,
        timeout: this.timeout,
        reconnect: true,
        maxReconnectAttempts: 10,
        reconnectTimeWait: 1000
      });

      logger.info('Connected to NATS successfully');

      // Handle connection events
      (async () => {
        for await (const status of this.connection.status()) {
          logger.info('NATS status change', { 
            type: status.type,
            data: status.data 
          });
        }
      })();

    } catch (error) {
      logger.error('Failed to connect to NATS', { error: error.message });
      this.connection = null;
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  async getStatus() {
    if (!this.enabled) {
      return {
        status: 'disabled',
        message: 'NATS not configured'
      };
    }

    try {
      await this._ensureConnection();
      
      if (this.connection && !this.connection.isClosed()) {
        return {
          status: 'healthy',
          message: 'NATS connection is active',
          server: this.connection.getServer()
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'NATS connection is closed'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  async publish(subject, data) {
    if (!this.enabled) {
      logger.debug('NATS is disabled, skipping publish', { subject });
      return;
    }

    try {
      await this._ensureConnection();
      
      if (!this.connection || this.connection.isClosed()) {
        logger.warn('NATS connection not available, skipping publish', { subject });
        return;
      }

      const payload = this.codec.encode(JSON.stringify(data));
      this.connection.publish(subject, payload);
      
      logger.info('Published message to NATS', { subject });
    } catch (error) {
      logger.error('Failed to publish to NATS', { 
        subject, 
        error: error.message 
      });
      // Don't throw - fail gracefully
    }
  }

  async subscribe(subject, handler) {
    if (!this.enabled) {
      logger.debug('NATS is disabled, skipping subscribe', { subject });
      return null;
    }

    try {
      await this._ensureConnection();
      
      if (!this.connection || this.connection.isClosed()) {
        throw new Error('NATS connection not available');
      }

      const subscription = this.connection.subscribe(subject);
      
      logger.info('Subscribed to NATS subject', { subject });

      // Handle messages asynchronously
      (async () => {
        for await (const msg of subscription) {
          try {
            const data = JSON.parse(this.codec.decode(msg.data));
            await handler(data);
          } catch (error) {
            logger.error('Error handling NATS message', { 
              subject, 
              error: error.message 
            });
          }
        }
      })();

      return subscription;
    } catch (error) {
      logger.error('Failed to subscribe to NATS', { 
        subject, 
        error: error.message 
      });
      throw error;
    }
  }

  async close() {
    if (this.connection && !this.connection.isClosed()) {
      try {
        await this.connection.drain();
        await this.connection.close();
        logger.info('NATS connection closed');
      } catch (error) {
        logger.error('Error closing NATS connection', { error: error.message });
      }
    }
  }
}

module.exports = NatsMessageBus;
