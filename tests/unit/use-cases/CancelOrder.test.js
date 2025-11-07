const CancelOrder = require('../../../src/features/orders/use-cases/CancelOrder');
const InMemoryOrderRepository = require('../../fakes/InMemoryOrderRepository');

describe('CancelOrder Use Case', () => {
  let cancelOrder;
  let orderRepository;
  let messageBus;
  let policyClient;

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository();
    
    messageBus = {
      publish: jest.fn(),
      isEnabled: () => true
    };

    policyClient = {
      authorize: jest.fn(),
      isEnabled: () => false // Disabled by default
    };

    cancelOrder = new CancelOrder({
      orderRepository,
      messageBus,
      policyClient
    });
  });

  afterEach(() => {
    orderRepository.clear();
    jest.clearAllMocks();
  });

  it('should cancel order successfully and publish OrderCanceled event', async () => {
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

    // Act
    const result = await cancelOrder.execute({
      orderId: order.id,
      reason: 'Customer request',
      canceledBy: 'cliente123'
    });

    // Assert
    expect(result.status).toBe('CANCELADO');

    expect(messageBus.publish).toHaveBeenCalledWith(
      'order.canceled',
      expect.objectContaining({
        eventType: 'order.canceled',
        orderId: order.id,
        numero: order.numero,
        reason: 'Customer request',
        canceledBy: 'cliente123'
      })
    );
  });

  it('should throw error when order not found', async () => {
    // Act & Assert
    await expect(
      cancelOrder.execute({
        orderId: 'nonexistent',
        reason: 'Test',
        canceledBy: 'user123'
      })
    ).rejects.toThrow('Pedido não encontrado');

    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('should throw error when order cannot be canceled (already delivered)', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 50,
      taxaEntrega: 5,
      valorFinal: 55,
      status: 'ENTREGUE',
      enderecoEntrega: {}
    });

    // Act & Assert
    await expect(
      cancelOrder.execute({
        orderId: order.id,
        reason: 'Test',
        canceledBy: 'user123'
      })
    ).rejects.toThrow('Pedido não pode ser cancelado');

    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('should throw error when order cannot be canceled (already canceled)', async () => {
    // Arrange
    const order = await orderRepository.create({
      clienteId: 'cliente123',
      restauranteId: 'restaurante123',
      items: [],
      valorTotal: 50,
      taxaEntrega: 5,
      valorFinal: 55,
      status: 'CANCELADO',
      enderecoEntrega: {}
    });

    // Act & Assert
    await expect(
      cancelOrder.execute({
        orderId: order.id,
        reason: 'Test',
        canceledBy: 'user123'
      })
    ).rejects.toThrow('Pedido não pode ser cancelado');

    expect(messageBus.publish).not.toHaveBeenCalled();
  });

  it('should respect policy client authorization when enabled', async () => {
    // Arrange
    policyClient.isEnabled = () => true;
    policyClient.authorize.mockResolvedValue({
      allowed: true,
      reason: 'User is owner'
    });

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

    // Act
    const result = await cancelOrder.execute({
      orderId: order.id,
      reason: 'Customer request',
      canceledBy: 'cliente123'
    });

    // Assert
    expect(result.status).toBe('CANCELADO');
    
    expect(policyClient.authorize).toHaveBeenCalledWith({
      action: 'cancel_order',
      resource: {
        type: 'order',
        id: order.id,
        status: 'PENDENTE',
        clienteId: 'cliente123'
      },
      subject: {
        id: 'cliente123',
        type: 'user'
      }
    });

    expect(messageBus.publish).toHaveBeenCalled();
  });

  it('should deny cancellation when policy client denies', async () => {
    // Arrange
    policyClient.isEnabled = () => true;
    policyClient.authorize.mockResolvedValue({
      allowed: false,
      reason: 'User is not owner'
    });

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

    // Act & Assert
    await expect(
      cancelOrder.execute({
        orderId: order.id,
        reason: 'Test',
        canceledBy: 'otherUser'
      })
    ).rejects.toThrow('Not authorized to cancel order');

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

    // Act
    const result = await cancelOrder.execute({
      orderId: order.id,
      reason: 'Test',
      canceledBy: 'user123'
    });

    // Assert
    expect(result.status).toBe('CANCELADO');
    expect(messageBus.publish).not.toHaveBeenCalled();
  });
});
