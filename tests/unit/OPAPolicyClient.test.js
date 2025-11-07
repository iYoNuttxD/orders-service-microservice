const OPAPolicyClient = require('../../src/infra/adapters/OPAPolicyClient');
const axios = require('axios');

jest.mock('axios');

describe('OPAPolicyClient', () => {
  let policyClient;
  let mockAxiosInstance;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn()
    };

    axios.create.mockReturnValue(mockAxiosInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when OPA is disabled', () => {
    beforeEach(() => {
      policyClient = new OPAPolicyClient({
        baseUrl: null, // Disabled
        policyPath: '/v1/data/orders/allow'
      });
    });

    it('should return disabled status', async () => {
      const status = await policyClient.getStatus();
      
      expect(status.status).toBe('disabled');
      expect(status.message).toBe('OPA policy client not configured');
    });

    it('should allow all authorizations by default', async () => {
      const result = await policyClient.authorize({
        action: 'create_order',
        resource: { type: 'order' },
        subject: { id: 'user123' }
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('OPA not configured');
    });
  });

  describe('when OPA is enabled', () => {
    beforeEach(() => {
      policyClient = new OPAPolicyClient({
        baseUrl: 'http://opa:8181',
        policyPath: '/v1/data/orders/allow',
        timeout: 5000,
        failOpen: true
      });
    });

    it('should return healthy status when OPA is reachable', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { status: 'ok' }
      });

      const status = await policyClient.getStatus();
      
      expect(status.status).toBe('healthy');
      expect(status.message).toBe('OPA is operational');
    });

    it('should return unhealthy status when OPA is unreachable', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection refused'));

      const status = await policyClient.getStatus();
      
      expect(status.status).toBe('unhealthy');
      expect(status.message).toBe('Connection refused');
    });

    it('should allow when OPA returns true result', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { result: true }
      });

      const result = await policyClient.authorize({
        action: 'create_order',
        resource: { type: 'order' },
        subject: { id: 'user123' }
      });

      expect(result.allowed).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/data/orders/allow',
        {
          input: {
            action: 'create_order',
            resource: { type: 'order' },
            subject: { id: 'user123' }
          }
        }
      );
    });

    it('should allow when OPA returns object with allow=true', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { 
          result: { 
            allow: true,
            reason: 'User is authorized'
          } 
        }
      });

      const result = await policyClient.authorize({
        action: 'cancel_order',
        resource: { type: 'order', id: '123' },
        subject: { id: 'user123' }
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('User is authorized');
    });

    it('should deny when OPA returns false result', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { result: false }
      });

      const result = await policyClient.authorize({
        action: 'delete_order',
        resource: { type: 'order', id: '123' },
        subject: { id: 'user456' }
      });

      expect(result.allowed).toBe(false);
    });

    it('should deny when OPA returns object with allow=false', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { 
          result: { 
            allow: false,
            reason: 'User is not authorized'
          } 
        }
      });

      const result = await policyClient.authorize({
        action: 'cancel_order',
        resource: { type: 'order', id: '123' },
        subject: { id: 'user456' }
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User is not authorized');
    });

    describe('fail-open behavior', () => {
      beforeEach(() => {
        policyClient = new OPAPolicyClient({
          baseUrl: 'http://opa:8181',
          policyPath: '/v1/data/orders/allow',
          failOpen: true
        });
      });

      it('should allow when OPA request fails', async () => {
        mockAxiosInstance.post.mockRejectedValue(new Error('Timeout'));

        const result = await policyClient.authorize({
          action: 'create_order',
          resource: { type: 'order' },
          subject: { id: 'user123' }
        });

        expect(result.allowed).toBe(true);
        expect(result.failedOpen).toBe(true);
        expect(result.reason).toContain('OPA error (fail-open)');
      });
    });

    describe('fail-closed behavior', () => {
      beforeEach(() => {
        policyClient = new OPAPolicyClient({
          baseUrl: 'http://opa:8181',
          policyPath: '/v1/data/orders/allow',
          failOpen: false // Fail closed
        });
      });

      it('should deny when OPA request fails', async () => {
        mockAxiosInstance.post.mockRejectedValue(new Error('Timeout'));

        const result = await policyClient.authorize({
          action: 'create_order',
          resource: { type: 'order' },
          subject: { id: 'user123' }
        });

        expect(result.allowed).toBe(false);
        expect(result.failedClosed).toBe(true);
        expect(result.reason).toContain('OPA error (fail-closed)');
      });
    });
  });
});
