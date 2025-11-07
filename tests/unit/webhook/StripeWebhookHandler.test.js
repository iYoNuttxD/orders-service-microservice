const StripeWebhookHandler = require('../../../src/features/stripe/http/webhook-handler');
const InMemoryOrderRepository = require('../../fakes/InMemoryOrderRepository');

describe('StripeWebhookHandler', () => {
  let handler;
  let orderRepository;
  let mockStripe;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository();
    
    mockStripe = {
      webhooks: {
        constructEvent: jest.fn()
      }
    };

    handler = new StripeWebhookHandler({
      orderRepository,
      stripe: mockStripe,
      webhookSecret: 'whsec_test_123'
    });

    mockReq = {
      headers: {
        'stripe-signature': 'test-signature'
      },
      rawBody: Buffer.from('{}'),
      body: {}
    };

    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    orderRepository.clear();
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    it('should verify signature and process valid webhook', async () => {
      const event = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            description: 'Order 1',
            status: 'succeeded'
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      // Create order
      const order = await orderRepository.create({
        clienteId: 'client123',
        restauranteId: 'rest123',
        items: [],
        valorTotal: 100,
        taxaEntrega: 10,
        valorFinal: 110,
        status: 'PENDENTE',
        enderecoEntrega: {}
      });

      // Update event to use correct order ID
      event.data.object.description = `Order ${order.id}`;

      await handler.handleWebhook(mockReq, mockRes);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        mockReq.rawBody,
        'test-signature',
        'whsec_test_123'
      );

      expect(mockRes.json).toHaveBeenCalledWith({ received: true });

      // Verify order was marked as paid
      const updatedOrder = await orderRepository.findById(order.id);
      expect(updatedOrder.status).toBe('PAGO');
      expect(updatedOrder.paymentTransactionId).toBe('pi_123');
      expect(updatedOrder.paymentProvider).toBe('stripe');
    });

    it('should reject webhook with invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await handler.handleWebhook(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Webhook signature verification failed'
      });
    });

    it('should accept webhook without secret (with warning)', async () => {
      handler = new StripeWebhookHandler({
        orderRepository,
        stripe: mockStripe,
        webhookSecret: null
      });

      const order = await orderRepository.create({
        clienteId: 'client123',
        restauranteId: 'rest123',
        items: [],
        valorTotal: 100,
        taxaEntrega: 10,
        valorFinal: 110,
        status: 'PENDENTE',
        enderecoEntrega: {}
      });

      mockReq.body = {
        id: 'evt_456',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_456',
            description: `Order ${order.id}`,
            status: 'succeeded'
          }
        }
      };

      await handler.handleWebhook(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle unknown event types gracefully', async () => {
      const event = {
        id: 'evt_789',
        type: 'unknown.event.type',
        data: { object: {} }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      await handler.handleWebhook(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('handlePaymentIntentSucceeded', () => {
    it('should mark order as paid', async () => {
      const order = await orderRepository.create({
        clienteId: 'client123',
        restauranteId: 'rest123',
        items: [],
        valorTotal: 100,
        taxaEntrega: 10,
        valorFinal: 110,
        status: 'PENDENTE',
        enderecoEntrega: {}
      });

      const paymentIntent = {
        id: 'pi_123',
        description: `Order ${order.id}`,
        status: 'succeeded'
      };

      await handler.handlePaymentIntentSucceeded(paymentIntent);

      const updatedOrder = await orderRepository.findById(order.id);
      expect(updatedOrder.status).toBe('PAGO');
      expect(updatedOrder.paymentTransactionId).toBe('pi_123');
      expect(updatedOrder.paymentMethod).toBe('card');
      expect(updatedOrder.paymentProvider).toBe('stripe');
      expect(updatedOrder.paymentAt).toBeInstanceOf(Date);
    });

    it('should be idempotent - not update already paid order', async () => {
      const order = await orderRepository.create({
        clienteId: 'client123',
        restauranteId: 'rest123',
        items: [],
        valorTotal: 100,
        taxaEntrega: 10,
        valorFinal: 110,
        status: 'PENDENTE',
        enderecoEntrega: {}
      });

      const paymentIntent = {
        id: 'pi_123',
        description: `Order ${order.id}`,
        status: 'succeeded'
      };

      // Process once
      await handler.handlePaymentIntentSucceeded(paymentIntent);
      const firstUpdate = await orderRepository.findById(order.id);
      const firstPaymentAt = firstUpdate.paymentAt;

      // Process again - should not update
      await handler.handlePaymentIntentSucceeded(paymentIntent);
      const secondUpdate = await orderRepository.findById(order.id);

      expect(secondUpdate.paymentAt).toEqual(firstPaymentAt);
    });

    it('should handle missing order gracefully', async () => {
      const paymentIntent = {
        id: 'pi_999',
        description: 'Order nonexistent',
        status: 'succeeded'
      };

      // Should not throw
      await expect(
        handler.handlePaymentIntentSucceeded(paymentIntent)
      ).resolves.not.toThrow();
    });
  });

  describe('handlePaymentIntentFailed', () => {
    it('should mark order as FAILED_PAYMENT', async () => {
      const order = await orderRepository.create({
        clienteId: 'client123',
        restauranteId: 'rest123',
        items: [],
        valorTotal: 100,
        taxaEntrega: 10,
        valorFinal: 110,
        status: 'PENDENTE',
        enderecoEntrega: {}
      });

      const paymentIntent = {
        id: 'pi_failed',
        description: `Order ${order.id}`,
        status: 'failed',
        last_payment_error: {
          message: 'Card declined'
        }
      };

      await handler.handlePaymentIntentFailed(paymentIntent);

      const updatedOrder = await orderRepository.findById(order.id);
      expect(updatedOrder.status).toBe('FAILED_PAYMENT');
    });

    it('should handle missing order gracefully', async () => {
      const paymentIntent = {
        id: 'pi_failed',
        description: 'Order nonexistent',
        status: 'failed'
      };

      await expect(
        handler.handlePaymentIntentFailed(paymentIntent)
      ).resolves.not.toThrow();
    });
  });

  describe('handleChargeRefunded', () => {
    it('should mark order as refunded', async () => {
      const order = await orderRepository.create({
        clienteId: 'client123',
        restauranteId: 'rest123',
        items: [],
        valorTotal: 100,
        taxaEntrega: 10,
        valorFinal: 110,
        status: 'PAGO',
        paymentTransactionId: 'pi_123',
        enderecoEntrega: {}
      });

      const charge = {
        id: 'ch_123',
        payment_intent: 'pi_123',
        refunds: {
          data: [
            {
              id: 'rf_123'
            }
          ]
        }
      };

      await handler.handleChargeRefunded(charge);

      const updatedOrder = await orderRepository.findById(order.id);
      expect(updatedOrder.refundId).toBe('rf_123');
      expect(updatedOrder.paymentRefundedAt).toBeInstanceOf(Date);
    });

    it('should be idempotent - not update already refunded order', async () => {
      const order = await orderRepository.create({
        clienteId: 'client123',
        restauranteId: 'rest123',
        items: [],
        valorTotal: 100,
        taxaEntrega: 10,
        valorFinal: 110,
        status: 'PAGO',
        paymentTransactionId: 'pi_123',
        enderecoEntrega: {}
      });

      const charge = {
        id: 'ch_123',
        payment_intent: 'pi_123',
        refunds: {
          data: [{ id: 'rf_123' }]
        }
      };

      // Process once
      await handler.handleChargeRefunded(charge);
      const firstUpdate = await orderRepository.findById(order.id);
      const firstRefundAt = firstUpdate.paymentRefundedAt;

      // Process again
      await handler.handleChargeRefunded(charge);
      const secondUpdate = await orderRepository.findById(order.id);

      expect(secondUpdate.paymentRefundedAt).toEqual(firstRefundAt);
    });
  });

  describe('extractOrderIdFromDescription', () => {
    it('should extract order ID from description', () => {
      const orderId = handler.extractOrderIdFromDescription('Order 507f1f77bcf86cd799439011');
      expect(orderId).toBe('507f1f77bcf86cd799439011');
    });

    it('should return null for invalid description', () => {
      const orderId = handler.extractOrderIdFromDescription('Invalid description');
      expect(orderId).toBe(null);
    });

    it('should return null for null description', () => {
      const orderId = handler.extractOrderIdFromDescription(null);
      expect(orderId).toBe(null);
    });
  });
});
