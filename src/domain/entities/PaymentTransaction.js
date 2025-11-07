/**
 * PaymentTransaction Domain Entity
 * Represents a payment transaction for an order
 */
class PaymentTransaction {
  constructor({
    id,
    orderId,
    amount,
    status,
    method,
    transactionId,
    gatewayResponse,
    createdAt,
    processedAt
  }) {
    this.id = id;
    this.orderId = orderId;
    this.amount = amount;
    this.status = status || 'PENDING'; // PENDING, APPROVED, DECLINED, REFUNDED
    this.method = method;
    this.transactionId = transactionId;
    this.gatewayResponse = gatewayResponse;
    this.createdAt = createdAt || new Date();
    this.processedAt = processedAt;
  }

  approve(transactionId, gatewayResponse) {
    this.status = 'APPROVED';
    this.transactionId = transactionId;
    this.gatewayResponse = gatewayResponse;
    this.processedAt = new Date();
  }

  decline(gatewayResponse) {
    this.status = 'DECLINED';
    this.gatewayResponse = gatewayResponse;
    this.processedAt = new Date();
  }

  refund(gatewayResponse) {
    if (this.status !== 'APPROVED') {
      throw new Error('Only approved transactions can be refunded');
    }
    this.status = 'REFUNDED';
    this.gatewayResponse = gatewayResponse;
  }

  toPrimitives() {
    return {
      id: this.id,
      orderId: this.orderId,
      amount: this.amount,
      status: this.status,
      method: this.method,
      transactionId: this.transactionId,
      gatewayResponse: this.gatewayResponse,
      createdAt: this.createdAt,
      processedAt: this.processedAt
    };
  }
}

module.exports = PaymentTransaction;
