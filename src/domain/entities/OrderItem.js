/**
 * OrderItem Domain Entity
 * Represents an item within an order
 */
class OrderItem {
  constructor({
    cardapioId,
    nome,
    quantidade,
    precoUnitario,
    subtotal
  }) {
    this.cardapioId = cardapioId;
    this.nome = nome;
    this.quantidade = quantidade;
    this.precoUnitario = precoUnitario;
    this.subtotal = subtotal || (quantidade * precoUnitario);
  }

  toPrimitives() {
    return {
      cardapioId: this.cardapioId,
      nome: this.nome,
      quantidade: this.quantidade,
      precoUnitario: this.precoUnitario,
      subtotal: this.subtotal
    };
  }
}

module.exports = OrderItem;
