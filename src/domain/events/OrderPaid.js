/**
 * OrderPaid Domain Event
 * Published when an order payment is processed successfully
 */
class OrderPaid {
  constructor({ orderId, numero, amount, paymentMethod, transactionId, occurredAt }) {
    this.eventType = 'order.paid';
    this.orderId = orderId;
    this.numero = numero;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
    this.transactionId = transactionId;
    this.occurredAt = occurredAt || new Date();
  }

  toPrimitives() {
    return {
      eventType: this.eventType,
      orderId: this.orderId,
      numero: this.numero,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      transactionId: this.transactionId,
      occurredAt: this.occurredAt.toISOString()
    };
  }
}

module.exports = OrderPaid;
