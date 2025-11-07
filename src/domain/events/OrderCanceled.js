/**
 * OrderCanceled Domain Event
 * Published when an order is canceled
 */
class OrderCanceled {
  constructor({ orderId, numero, reason, canceledBy, occurredAt }) {
    this.eventType = 'order.canceled';
    this.orderId = orderId;
    this.numero = numero;
    this.reason = reason;
    this.canceledBy = canceledBy;
    this.occurredAt = occurredAt || new Date();
  }

  toPrimitives() {
    return {
      eventType: this.eventType,
      orderId: this.orderId,
      numero: this.numero,
      reason: this.reason,
      canceledBy: this.canceledBy,
      occurredAt: this.occurredAt.toISOString()
    };
  }
}

module.exports = OrderCanceled;
