/**
 * Order Domain Entity
 * Represents an order with business rules
 */
class Order {
  constructor({
    id,
    numero,
    clienteId,
    restauranteId,
    items = [],
    valorTotal = 0,
    taxaEntrega = 0,
    valorFinal = 0,
    status = 'PENDENTE',
    enderecoEntrega,
    observacoes,
    dataPedido,
    dataConfirmacao,
    dataEntrega,
    paymentTransactionId,
    paymentMethod,
    paymentProvider,
    paymentAt,
    paymentRefundedAt,
    refundId,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.numero = numero;
    this.clienteId = clienteId;
    this.restauranteId = restauranteId;
    this.items = items;
    this.valorTotal = valorTotal;
    this.taxaEntrega = taxaEntrega;
    this.valorFinal = valorFinal;
    this.status = status;
    this.enderecoEntrega = enderecoEntrega;
    this.observacoes = observacoes;
    this.dataPedido = dataPedido || new Date();
    this.dataConfirmacao = dataConfirmacao;
    this.dataEntrega = dataEntrega;
    this.paymentTransactionId = paymentTransactionId;
    this.paymentMethod = paymentMethod;
    this.paymentProvider = paymentProvider;
    this.paymentAt = paymentAt;
    this.paymentRefundedAt = paymentRefundedAt;
    this.refundId = refundId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  canTransitionTo(newStatus) {
    const validTransitions = {
      'PENDENTE': ['PAGO', 'CONFIRMADO', 'CANCELADO', 'FAILED_PAYMENT'],
      'PAGO': ['CONFIRMADO', 'CANCELADO'],
      'CONFIRMADO': ['PREPARANDO', 'CANCELADO'],
      'PREPARANDO': ['PRONTO', 'CANCELADO'],
      'PRONTO': ['EM_ENTREGA'],
      'EM_ENTREGA': ['ENTREGUE'],
      'ENTREGUE': [],
      'CANCELADO': [],
      'FAILED_PAYMENT': ['PENDENTE']
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
  }

  canBeCanceled() {
    return !['ENTREGUE', 'CANCELADO'].includes(this.status);
  }

  canBePaid() {
    return ['PENDENTE', 'CONFIRMADO', 'FAILED_PAYMENT'].includes(this.status);
  }

  markAsPaid({ transactionId, method, provider }) {
    if (!this.canBePaid()) {
      throw new Error(`Pedido não pode ser pago no status ${this.status}`);
    }
    this.status = 'PAGO';
    this.paymentTransactionId = transactionId;
    this.paymentMethod = method;
    this.paymentProvider = provider;
    this.paymentAt = new Date();
  }

  markPaymentFailed() {
    if (!['PENDENTE'].includes(this.status)) {
      throw new Error(`Cannot mark payment failed from status ${this.status}`);
    }
    this.status = 'FAILED_PAYMENT';
  }

  markAsRefunded({ refundId }) {
    this.refundId = refundId;
    this.paymentRefundedAt = new Date();
  }

  updateStatus(newStatus) {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Transição inválida de ${this.status} para ${newStatus}`);
    }
    this.status = newStatus;
    
    if (newStatus === 'CONFIRMADO') {
      this.dataConfirmacao = new Date();
    } else if (newStatus === 'ENTREGUE') {
      this.dataEntrega = new Date();
    }
  }

  cancel() {
    if (!this.canBeCanceled()) {
      throw new Error('Pedido não pode ser cancelado');
    }
    this.status = 'CANCELADO';
  }

  toPrimitives() {
    return {
      id: this.id,
      numero: this.numero,
      clienteId: this.clienteId,
      restauranteId: this.restauranteId,
      items: this.items,
      valorTotal: this.valorTotal,
      taxaEntrega: this.taxaEntrega,
      valorFinal: this.valorFinal,
      status: this.status,
      enderecoEntrega: this.enderecoEntrega,
      observacoes: this.observacoes,
      dataPedido: this.dataPedido,
      dataConfirmacao: this.dataConfirmacao,
      dataEntrega: this.dataEntrega,
      paymentTransactionId: this.paymentTransactionId,
      paymentMethod: this.paymentMethod,
      paymentProvider: this.paymentProvider,
      paymentAt: this.paymentAt,
      paymentRefundedAt: this.paymentRefundedAt,
      refundId: this.refundId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Order;
