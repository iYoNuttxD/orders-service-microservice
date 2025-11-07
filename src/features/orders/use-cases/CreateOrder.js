const Order = require('../../../domain/entities/Order');
const OrderCreated = require('../../../domain/events/OrderCreated');
const logger = require('../../../utils/logger');

/**
 * CreateOrder Use Case
 * Handles order creation with validation and event publishing
 */
class CreateOrder {
  constructor({ 
    orderRepository, 
    clienteRepository,
    restauranteRepository,
    cardapioRepository,
    messageBus,
    policyClient 
  }) {
    this.orderRepository = orderRepository;
    this.clienteRepository = clienteRepository;
    this.restauranteRepository = restauranteRepository;
    this.cardapioRepository = cardapioRepository;
    this.messageBus = messageBus;
    this.policyClient = policyClient;
  }

  async execute(data) {
    try {
      logger.info('Creating new order', { clienteId: data.clienteId });
      
      // Authorize if policy client is enabled
      if (this.policyClient.isEnabled()) {
        const authResult = await this.policyClient.authorize({
          action: 'create_order',
          resource: { type: 'order', restauranteId: data.restauranteId },
          subject: { id: data.clienteId, type: 'cliente' }
        });

        if (!authResult.allowed) {
          const error = new Error('Not authorized to create order');
          error.statusCode = 403;
          error.reason = authResult.reason;
          throw error;
        }
      }

      // Verify cliente exists
      const cliente = await this.clienteRepository.findById(data.clienteId);
      if (!cliente) {
        const error = new Error('Cliente não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      // Verify restaurante exists and is active
      const restaurante = await this.restauranteRepository.findById(data.restauranteId);
      if (!restaurante) {
        const error = new Error('Restaurante não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      if (restaurante.status !== 'ATIVO') {
        const error = new Error('Restaurante não está ativo');
        error.statusCode = 400;
        throw error;
      }
      
      // Process items and calculate values
      const itemsProcessados = [];
      let valorTotal = 0;
      
      for (const item of data.items) {
        const cardapio = await this.cardapioRepository.findById(item.cardapioId);
        
        if (!cardapio) {
          const error = new Error(`Item do cardápio não encontrado: ${item.cardapioId}`);
          error.statusCode = 404;
          throw error;
        }
        
        if (!cardapio.disponivel) {
          const error = new Error(`Item não disponível: ${cardapio.nome}`);
          error.statusCode = 400;
          throw error;
        }
        
        const subtotal = cardapio.preco * item.quantidade;
        valorTotal += subtotal;
        
        itemsProcessados.push({
          cardapioId: cardapio._id,
          nome: cardapio.nome,
          quantidade: item.quantidade,
          precoUnitario: cardapio.preco,
          subtotal
        });
      }
      
      // Calculate final values
      const taxaEntrega = data.taxaEntrega || 5.00;
      const valorFinal = valorTotal + taxaEntrega;
      
      const orderData = {
        ...data,
        items: itemsProcessados,
        valorTotal,
        taxaEntrega,
        valorFinal,
        enderecoEntrega: data.enderecoEntrega || cliente.endereco
      };
      
      // Create order
      const order = await this.orderRepository.create(orderData);
      logger.info('Order created successfully', { 
        id: order.id, 
        numero: order.numero 
      });
      
      // Publish OrderCreated event
      if (this.messageBus.isEnabled()) {
        const event = new OrderCreated({
          orderId: order.id,
          numero: order.numero,
          clienteId: order.clienteId,
          restauranteId: order.restauranteId,
          valorTotal: order.valorTotal,
          items: order.items
        });

        await this.messageBus.publish('order.created', event.toPrimitives());
      }
      
      return order;
    } catch (error) {
      logger.error('Error creating order', { error: error.message });
      throw error;
    }
  }
}

module.exports = CreateOrder;
