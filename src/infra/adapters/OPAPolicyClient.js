const axios = require('axios');
const PolicyClientPort = require('../../../domain/ports/PolicyClient');
const logger = require('../../../utils/logger');

/**
 * OPAPolicyClient
 * Adapter for Open Policy Agent authorization
 */
class OPAPolicyClient extends PolicyClientPort {
  constructor({ baseUrl, policyPath, timeout = 5000, failOpen = true }) {
    super();
    this.baseUrl = baseUrl;
    this.policyPath = policyPath || '/v1/data/orders/allow';
    this.timeout = timeout;
    this.failOpen = failOpen; // If true, allow on OPA failure
    this.enabled = !!baseUrl;
    
    if (this.enabled) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async getStatus() {
    if (!this.enabled) {
      return {
        status: 'disabled',
        message: 'OPA policy client not configured'
      };
    }

    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return {
        status: 'healthy',
        message: 'OPA is operational',
        details: response.data
      };
    } catch (error) {
      logger.warn('OPA health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: error.message,
        failOpen: this.failOpen
      };
    }
  }

  async authorize({ action, resource, subject }) {
    if (!this.enabled) {
      logger.debug('OPA is disabled, allowing by default');
      return {
        allowed: true,
        reason: 'OPA not configured'
      };
    }

    try {
      logger.debug('Authorizing with OPA', { action, resource, subject });
      
      const response = await this.client.post(this.policyPath, {
        input: {
          action,
          resource,
          subject
        }
      });

      const allowed = response.data.result === true || response.data.result?.allow === true;
      
      logger.debug('OPA authorization result', { action, allowed });
      
      return {
        allowed,
        reason: response.data.result?.reason,
        details: response.data.result
      };
    } catch (error) {
      logger.error('OPA authorization failed', { 
        action, 
        error: error.message,
        stack: error.stack
      });

      if (this.failOpen) {
        logger.warn('OPA failure, failing open (allowing)', { action });
        return {
          allowed: true,
          reason: `OPA error (fail-open): ${error.message}`,
          failedOpen: true
        };
      } else {
        logger.warn('OPA failure, failing closed (denying)', { action });
        return {
          allowed: false,
          reason: `OPA error (fail-closed): ${error.message}`,
          failedClosed: true
        };
      }
    }
  }
}

module.exports = OPAPolicyClient;
