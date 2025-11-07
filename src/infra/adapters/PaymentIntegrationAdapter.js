const axios = require('axios');
const crypto = require('crypto');
const PaymentGatewayPort = require('../../domain/ports/PaymentGateway');
const logger = require('../../utils/logger');

/**
 * PaymentIntegrationAdapter
 * HTTP adapter for external payment gateway integration
 */
class PaymentIntegrationAdapter extends PaymentGatewayPort {
  constructor({ baseUrl, apiKey, timeout = 10000 }) {
    super();
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.enabled = !!(baseUrl && apiKey);
    
    if (this.enabled) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
    }
  }

  getProviderName() {
    return 'http';
  }

  isEnabled() {
    return this.enabled;
  }

  async getStatus() {
    if (!this.enabled) {
      return {
        status: 'disabled',
        message: 'Payment gateway not configured'
      };
    }

    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return {
        status: 'healthy',
        message: 'Payment gateway is operational',
        details: response.data
      };
    } catch (error) {
      logger.warn('Payment gateway health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  async processPayment({ amount, method, orderId, metadata = {} }) {
    if (!this.enabled) {
      logger.warn('Payment gateway is disabled, simulating approval');
      return {
        success: true,
        transactionId: `MOCK_${Date.now()}`,
        status: 'APPROVED',
        message: 'Payment simulated (gateway disabled)'
      };
    }

    try {
      logger.info('Processing payment', { orderId, amount, method });
      
      // Generate cryptographically secure idempotency key
      const randomBytes = crypto.randomBytes(8).toString('hex');
      const idempotencyKey = `order-${orderId}-${randomBytes}`;
      
      const response = await this.client.post('/payments', {
        amount,
        method,
        orderId,
        metadata
      }, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });

      if (response.data.status === 'APPROVED' || response.data.status === 'approved') {
        logger.info('Payment approved', { 
          orderId, 
          transactionId: response.data.transactionId 
        });
        
        return {
          success: true,
          transactionId: response.data.transactionId,
          status: 'APPROVED',
          message: response.data.message || 'Payment approved',
          gatewayResponse: response.data
        };
      } else {
        logger.warn('Payment declined', { orderId, reason: response.data.reason });
        
        return {
          success: false,
          transactionId: response.data.transactionId,
          status: 'DECLINED',
          message: response.data.message || 'Payment declined',
          reason: response.data.reason,
          gatewayResponse: response.data
        };
      }
    } catch (error) {
      logger.error('Payment processing failed', { 
        orderId, 
        error: error.message,
        stack: error.stack
      });

      if (error.response) {
        return {
          success: false,
          status: 'DECLINED',
          message: error.response.data?.message || 'Payment gateway error',
          gatewayResponse: error.response.data
        };
      }

      throw new Error(`Payment gateway error: ${error.message}`);
    }
  }

  async refund(transactionId, amount) {
    if (!this.enabled) {
      logger.warn('Payment gateway is disabled, simulating refund');
      return {
        success: true,
        refundId: `REFUND_MOCK_${Date.now()}`,
        message: 'Refund simulated (gateway disabled)'
      };
    }

    try {
      logger.info('Processing refund', { transactionId, amount });
      
      const response = await this.client.post('/refunds', {
        transactionId,
        amount
      });

      logger.info('Refund processed', { transactionId, refundId: response.data.refundId });
      
      return {
        success: true,
        refundId: response.data.refundId,
        message: response.data.message || 'Refund processed',
        gatewayResponse: response.data
      };
    } catch (error) {
      logger.error('Refund processing failed', { 
        transactionId, 
        error: error.message 
      });

      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Refund failed',
          gatewayResponse: error.response.data
        };
      }

      throw new Error(`Payment gateway error: ${error.message}`);
    }
  }
}

module.exports = PaymentIntegrationAdapter;
