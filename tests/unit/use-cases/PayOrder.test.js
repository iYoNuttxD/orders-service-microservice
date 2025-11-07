const PayOrder = require('../../../src/features/orders/use-cases/PayOrder');
const InMemoryOrderRepository = require('../../fakes/InMemoryOrderRepository');
const Order = require('../../../src/domain/entities/Order');

describe('PayOrder Use Case', () => {
  let payOrder;
  let orderRepository;
  let paymentGateway;
  let messageBus;
  let metrics;

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository();
    
    paymentGateway = {
      processPayment: jest.fn(),
      isEnabled: () => true,
      getProviderName: () => 'stripe'
    };
    
    messageBus = {
      publish: jest.fn(),
      isEnabled: () => true
    };

    metrics = {
      paymentsAttemptCounter: {
        labels: jest.fn().mockReturnValue({
          inc: jest.fn()
        })
      },
      paymentsSuccessCounter: {
        labels: jest.fn().mockReturnValue({
          inc: jest.fn()
        })
      },
      paymentsFailureCounter: {
        labels: jest.fn().mockReturnValue({
          inc: jest.fn()
        })
      },
      paymentLatencyHistogram: {
        labels: jest.fn().mockReturnValue({
          observe: jest.fn()
        })
      }
    };

    payOrder = new PayOrder({
      orderRepository,
      paymentGateway,
      messageBus,
      metrics
    });
  });

  afterEach(() => {
    orderRepository.clear();
    jest.clearAllMocks();
  });

  it('should process payment successfully and publish OrderPaid event', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [
        { cardapioId: 'item1', nome: 'Pizza', quantidade: 2, precoUnitario: 45.90, subtotal: 91.80 }
      ],
      valorTotal: 91.80,
      taxaEntrega: 5.00,
      valorFinal: 96.80,
      status: 'PENDENTE',
      enderecoEntrega: {
        rua: 'Rua Teste',
        numero: '100',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01000000'
      }
    });

    paymentGateway.processPayment.mockResolvedValue({
      success: true,
      transactionId: 'TXN123456',
      status: 'APPROVED',
      message: 'Payment approved'
    });

    // Act
    const result = await payOrder.execute({
      orderId: order.id,
      paymentMethod: 'credit_card',
      paymentData: { cardNumber: '**** 1234' }
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.order).toBeDefined();
    expect(result.payment.transactionId).toBe('TXN123456');
    expect(result.payment.status).toBe('APPROVED');

    expect(paymentGateway.processPayment).toHaveBeenCalledWith({
      amount: 96.80,
      method: 'credit_card',
      orderId: order.id,
      idempotencyKey: expect.any(String),
      metadata: expect.objectContaining({
        numero: order.numero,
        clienteId: 'cliente123',
        cardNumber: '**** 1234'
      })
    });

    expect(messageBus.publish).toHaveBeenCalledWith(
      'order.paid',
      expect.objectContaining({
        eventType: 'order.paid',
        orderId: order.id,
        numero: order.numero,
        amount: 96.80,
        paymentMethod: 'credit_card',
        transactionId: 'TXN123456'
      })
    );
  });

  it('should throw error when order not found', async () => {
    // Act & Assert
    await expect(
      payOrder.execute({
        orderId: 'nonexistent',
        paymentMethod: 'credit_card'
      })
    ).rejects.toThrow('Pedido não encontrado');

    expect(paymentGateway.processPayment).not.toHaveBeenCalled();
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('should throw error when order cannot be paid', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 50,
      taxaEntrega: 5,
      valorFinal: 55,
      status: 'ENTREGUE', // Already delivered
      enderecoEntrega: {}
    });

    // Act & Assert
    await expect(
      payOrder.execute({
        orderId: order.id,
        paymentMethod: 'credit_card'
      })
    ).rejects.toThrow('Pedido não pode ser pago no status ENTREGUE');

    expect(paymentGateway.processPayment).not.toHaveBeenCalled();
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('should throw error when payment gateway declines', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 50,
      taxaEntrega: 5,
      valorFinal: 55,
      status: 'PENDENTE',
      enderecoEntrega: {}
    });

    paymentGateway.processPayment.mockResolvedValue({
      success: false,
      status: 'DECLINED',
      message: 'Insufficient funds',
      reason: 'INSUFFICIENT_FUNDS'
    });

    // Act & Assert
    await expect(
      payOrder.execute({
        orderId: order.id,
        paymentMethod: 'credit_card'
      })
    ).rejects.toThrow('Insufficient funds');

    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('should not publish event when message bus is disabled', async () => {
    // Arrange
    messageBus.isEnabled = () => false;

    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 50,
      taxaEntrega: 5,
      valorFinal: 55,
      status: 'PENDENTE',
      enderecoEntrega: {}
    });

    paymentGateway.processPayment.mockResolvedValue({
      success: true,
      transactionId: 'TXN789',
      status: 'APPROVED',
      message: 'Payment approved'
    });

    // Act
    const result = await payOrder.execute({
      orderId: order.id,
      paymentMethod: 'credit_card'
    });

    // Assert
    expect(result.payment.transactionId).toBe('TXN789');
    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('should track metrics on successful payment', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 100,
      taxaEntrega: 10,
      valorFinal: 110,
      status: 'PENDENTE',
      enderecoEntrega: {}
    });

    paymentGateway.processPayment.mockResolvedValue({
      success: true,
      transactionId: 'TXN999',
      status: 'APPROVED',
      message: 'Payment approved'
    });

    // Act
    await payOrder.execute({
      orderId: order.id,
      paymentMethod: 'credit_card'
    });

    // Assert
    expect(metrics.paymentsAttemptCounter.labels).toHaveBeenCalledWith('stripe');
    expect(metrics.paymentsSuccessCounter.labels).toHaveBeenCalledWith('stripe');
    expect(metrics.paymentLatencyHistogram.labels).toHaveBeenCalledWith('stripe', 'success');
  });

  it('should track metrics on failed payment', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 50,
      taxaEntrega: 5,
      valorFinal: 55,
      status: 'PENDENTE',
      enderecoEntrega: {}
    });

    paymentGateway.processPayment.mockResolvedValue({
      success: false,
      status: 'DECLINED',
      message: 'Insufficient funds'
    });

    // Act & Assert
    await expect(
      payOrder.execute({
        orderId: order.id,
        paymentMethod: 'credit_card'
      })
    ).rejects.toThrow('Insufficient funds');

    expect(metrics.paymentsAttemptCounter.labels).toHaveBeenCalledWith('stripe');
    expect(metrics.paymentsFailureCounter.labels).toHaveBeenCalledWith('stripe');
    expect(metrics.paymentLatencyHistogram.labels).toHaveBeenCalledWith('stripe', 'failure');
  });

  it('should use provided idempotency key', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 50,
      taxaEntrega: 5,
      valorFinal: 55,
      status: 'PENDENTE',
      enderecoEntrega: {}
    });

    paymentGateway.processPayment.mockResolvedValue({
      success: true,
      transactionId: 'TXN_CUSTOM',
      status: 'APPROVED'
    });

    // Act
    await payOrder.execute({
      orderId: order.id,
      paymentMethod: 'credit_card',
      idempotencyKey: 'custom-key-123'
    });

    // Assert
    expect(paymentGateway.processPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'custom-key-123'
      })
    );
  });

  it('should return existing payment for already paid order (idempotent)', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 50,
      taxaEntrega: 5,
      valorFinal: 55,
      status: 'PAGO',
      paymentTransactionId: 'TXN_EXISTING',
      enderecoEntrega: {}
    });

    // Act
    const result = await payOrder.execute({
      orderId: order.id,
      paymentMethod: 'credit_card'
    });

    // Assert
    expect(result.payment.transactionId).toBe('TXN_EXISTING');
    expect(result.payment.message).toContain('idempotent');
    expect(paymentGateway.processPayment).not.toHaveBeenCalled();
  });

  it('should update order with payment metadata', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 100,
      taxaEntrega: 10,
      valorFinal: 110,
      status: 'PENDENTE',
      enderecoEntrega: {}
    });

    paymentGateway.processPayment.mockResolvedValue({
      success: true,
      transactionId: 'TXN_METADATA',
      status: 'APPROVED'
    });

    // Act
    await payOrder.execute({
      orderId: order.id,
      paymentMethod: 'credit_card'
    });

    // Assert
    const updatedOrder = await orderRepository.findById(order.id);
    expect(updatedOrder.status).toBe('PAGO');
    expect(updatedOrder.paymentTransactionId).toBe('TXN_METADATA');
    expect(updatedOrder.paymentMethod).toBe('credit_card');
    expect(updatedOrder.paymentProvider).toBe('stripe');
    expect(updatedOrder.paymentAt).toBeInstanceOf(Date);
  });
});
