const OrderRepository = require('../../src/domain/ports/OrderRepository');
const Order = require('../../src/domain/entities/Order');

/**
 * In-Memory OrderRepository for testing
 */
class InMemoryOrderRepository extends OrderRepository {
  constructor() {
    super();
    this.orders = new Map();
    this.nextId = 1;
  }

  async findById(id) {
    return this.orders.get(id) || null;
  }

  async findAll(filters = {}) {
    let orders = Array.from(this.orders.values());
    
    if (filters.clienteId) {
      orders = orders.filter(o => o.clienteId === filters.clienteId);
    }
    
    if (filters.restauranteId) {
      orders = orders.filter(o => o.restauranteId === filters.restauranteId);
    }
    
    if (filters.status) {
      orders = orders.filter(o => o.status === filters.status);
    }
    
    if (filters.dataInicio || filters.dataFim) {
      orders = orders.filter(o => {
        const orderDate = new Date(o.dataPedido);
        if (filters.dataInicio && orderDate < new Date(filters.dataInicio)) {
          return false;
        }
        if (filters.dataFim && orderDate > new Date(filters.dataFim)) {
          return false;
        }
        return true;
      });
    }

    return orders.sort((a, b) => b.dataPedido - a.dataPedido);
  }

  async create(orderData) {
    const id = String(this.nextId++);
    const numero = orderData.numero || `PED${String(id).padStart(6, '0')}`;
    
    const order = new Order({
      id,
      numero,
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.orders.set(id, order);
    return order;
  }

  async updateStatus(id, status) {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error('Order not found');
    }
    
    order.updateStatus(status);
    order.updatedAt = new Date();
    
    return order;
  }

  async update(id, orderData) {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error('Order not found');
    }

    // Update order fields
    Object.keys(orderData).forEach(key => {
      if (key !== 'id') {
        order[key] = orderData[key];
      }
    });
    order.updatedAt = new Date();

    return order;
  }

  async countByStatus(status) {
    return Array.from(this.orders.values())
      .filter(o => o.status === status)
      .length;
  }

  async getTotalVendas() {
    return Array.from(this.orders.values())
      .filter(o => o.status === 'ENTREGUE')
      .reduce((sum, o) => sum + o.valorFinal, 0);
  }

  // Test helpers
  clear() {
    this.orders.clear();
    this.nextId = 1;
  }

  count() {
    return this.orders.size;
  }
}

module.exports = InMemoryOrderRepository;
