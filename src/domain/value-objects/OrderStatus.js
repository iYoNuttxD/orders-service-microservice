/**
 * OrderStatus Value Object
 * Represents the status of an order with validation
 */
class OrderStatus {
  static PENDENTE = 'PENDENTE';
  static CONFIRMADO = 'CONFIRMADO';
  static PREPARANDO = 'PREPARANDO';
  static PRONTO = 'PRONTO';
  static EM_ENTREGA = 'EM_ENTREGA';
  static ENTREGUE = 'ENTREGUE';
  static CANCELADO = 'CANCELADO';

  static VALID_STATUSES = [
    OrderStatus.PENDENTE,
    OrderStatus.CONFIRMADO,
    OrderStatus.PREPARANDO,
    OrderStatus.PRONTO,
    OrderStatus.EM_ENTREGA,
    OrderStatus.ENTREGUE,
    OrderStatus.CANCELADO
  ];

  constructor(value) {
    if (!OrderStatus.VALID_STATUSES.includes(value)) {
      throw new Error(`Invalid order status: ${value}`);
    }
    this.value = value;
  }

  equals(other) {
    return this.value === other.value;
  }

  isPending() {
    return this.value === OrderStatus.PENDENTE;
  }

  isConfirmed() {
    return this.value === OrderStatus.CONFIRMADO;
  }

  isDelivered() {
    return this.value === OrderStatus.ENTREGUE;
  }

  isCanceled() {
    return this.value === OrderStatus.CANCELADO;
  }

  toString() {
    return this.value;
  }

  toPrimitives() {
    return this.value;
  }
}

module.exports = OrderStatus;
