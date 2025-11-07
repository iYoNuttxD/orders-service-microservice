const StripePaymentAdapter = require('../../../src/infra/adapters/StripePaymentAdapter');

describe('StripePaymentAdapter', () => {
  let adapter;
  let mockStripe;
  let mockLogger;
  let mockMetrics;

  beforeEach(() => {
    // Mock Stripe SDK
    mockStripe = {
      accounts: {
        retrieve: jest.fn()
      },
      paymentIntents: {
        create: jest.fn()
      },
      webhooks: {
        constructEvent: jest.fn()
      }
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    mockMetrics = {
      observe: jest.fn()
    };

    // Mock Stripe constructor
    jest.mock('stripe', () => {
      return jest.fn().mockImplementation(() => mockStripe);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with secret key', () => {
      adapter = new StripePaymentAdapter(
        { secretKey: 'sk_test_123', currency: 'brl' },
        mockLogger,
        mockMetrics
      );

      expect(adapter.isEnabled()).toBe(true);
      expect(adapter.currency).toBe('brl');
    });

    it('should be disabled without secret key', () => {
      adapter = new StripePaymentAdapter(
        { secretKey: null, currency: 'usd' },
        mockLogger,
        mockMetrics
      );

      expect(adapter.isEnabled()).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return disabled status when not configured', async () => {
      adapter = new StripePaymentAdapter({}, mockLogger, mockMetrics);

      const status = await adapter.getStatus();

      expect(status).toEqual({
        status: 'disabled',
        message: 'Stripe not configured'
      });
    });

    it('should return healthy status with account details when configured', async () => {
      adapter = new StripePaymentAdapter(
        { secretKey: 'sk_test_123' },
        mockLogger,
        mockMetrics
      );

      // Override stripe with mock
      adapter.stripe = mockStripe;

      mockStripe.accounts.retrieve.mockResolvedValue({
        id: 'acct_123',
        settings: {
          dashboard: {
            display_name: 'Test Account'
          }
        }
      });

      const status = await adapter.getStatus();

      expect(status).toEqual({
        status: 'healthy',
        message: 'Stripe is operational',
        details: {
          accountId: 'acct_123',
          displayName: 'Test Account'
        }
      });
    });

    it('should return unhealthy status on API error', async () => {
      adapter = new StripePaymentAdapter(
        { secretKey: 'sk_test_123' },
        mockLogger,
        mockMetrics
      );

      adapter.stripe = mockStripe;

      mockStripe.accounts.retrieve.mockRejectedValue(
        new Error('Invalid API key')
      );

      const status = await adapter.getStatus();

      expect(status).toEqual({
        status: 'unhealthy',
        message: 'Invalid API key'
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Stripe health check failed',
        { error: 'Invalid API key' }
      );
    });
  });

  describe('processPayment', () => {
    beforeEach(() => {
      adapter = new StripePaymentAdapter(
        { secretKey: 'sk_test_123', currency: 'brl', timeout: 5000 },
        mockLogger,
        mockMetrics
      );
      adapter.stripe = mockStripe;
    });

    it('should process successful payment with idempotency key', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        status: 'succeeded',
        charges: {
          data: [{ id: 'ch_123' }]
        }
      });

      const result = await adapter.processPayment({
        orderId: 'order123',
        amount: 100.50,
        idempotencyKey: 'test-key-123'
      });

      expect(result).toEqual({
        success: true,
        transactionId: 'pi_123',
        providerStatus: 'succeeded',
        raw: {
          charges: 1
        }
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        {
          amount: 10050, // 100.50 * 100
          currency: 'brl',
          description: 'Order order123',
          confirm: true,
          payment_method: 'pm_card_visa'
        },
        {
          idempotencyKey: 'test-key-123',
          timeout: 5000
        }
      );

      expect(mockMetrics.observe).toHaveBeenCalledWith(
        'payment_latency_ms',
        expect.any(Number)
      );
    });

    it('should handle payment failure', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue({
        message: 'Card declined',
        code: 'card_declined'
      });

      const result = await adapter.processPayment({
        orderId: 'order123',
        amount: 50.00,
        idempotencyKey: 'test-key-456'
      });

      expect(result).toEqual({
        success: false,
        error: 'Card declined',
        providerStatus: 'card_declined'
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Stripe payment failed',
        { error: 'Card declined', code: 'card_declined' }
      );

      expect(mockMetrics.observe).toHaveBeenCalledWith(
        'payment_latency_ms',
        expect.any(Number)
      );
    });

    it('should return disabled status when not configured', async () => {
      adapter = new StripePaymentAdapter({}, mockLogger, mockMetrics);

      const result = await adapter.processPayment({
        orderId: 'order123',
        amount: 50.00
      });

      expect(result).toEqual({
        success: false,
        disabled: true
      });
    });

    it('should handle payment intent with non-succeeded status', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_456',
        status: 'requires_action',
        charges: {
          data: []
        }
      });

      const result = await adapter.processPayment({
        orderId: 'order456',
        amount: 75.25,
        idempotencyKey: 'test-key-789'
      });

      expect(result).toEqual({
        success: false,
        transactionId: 'pi_456',
        providerStatus: 'requires_action',
        raw: {
          charges: 0
        }
      });
    });
  });
});
