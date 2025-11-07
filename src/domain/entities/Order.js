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
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  canTransitionTo(newStatus) {
    const validTransitions = {
      'PENDENTE': ['CONFIRMADO', 'CANCELADO'],
      'CONFIRMADO': ['PREPARANDO', 'CANCELADO'],
      'PREPARANDO': ['PRONTO', 'CANCELADO'],
      'PRONTO': ['EM_ENTREGA'],
      'EM_ENTREGA': ['ENTREGUE'],
      'ENTREGUE': [],
      'CANCELADO': []
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
  }

  canBeCanceled() {
    return !['ENTREGUE', 'CANCELADO'].includes(this.status);
  }

  canBePaid() {
    return ['PENDENTE', 'CONFIRMADO'].includes(this.status);
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
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Order;
