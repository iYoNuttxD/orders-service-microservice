/**
 * OrderCreated Domain Event
 * Published when a new order is created
 */
class OrderCreated {
  constructor({ orderId, numero, clienteId, restauranteId, valorTotal, items, occurredAt }) {
    this.eventType = 'order.created';
    this.orderId = orderId;
    this.numero = numero;
    this.clienteId = clienteId;
    this.restauranteId = restauranteId;
    this.valorTotal = valorTotal;
    this.items = items;
    this.occurredAt = occurredAt || new Date();
  }

  toPrimitives() {
    return {
      eventType: this.eventType,
      orderId: this.orderId,
      numero: this.numero,
      clienteId: this.clienteId,
      restauranteId: this.restauranteId,
      valorTotal: this.valorTotal,
      items: this.items,
      occurredAt: this.occurredAt.toISOString()
    };
  }
}

module.exports = OrderCreated;
