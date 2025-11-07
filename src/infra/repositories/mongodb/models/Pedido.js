const mongoose = require('mongoose');

const pedidoItemSchema = new mongoose.Schema({
  cardapioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cardapio',
    required: true
  },
  nome: { type: String, required: true },
  quantidade: {
    type: Number,
    required: true,
    min: [1, 'Quantidade deve ser pelo menos 1']
  },
  precoUnitario: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: false });

const pedidoSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true
  },
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  restauranteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurante',
    required: true
  },
  items: [pedidoItemSchema],
  valorTotal: {
    type: Number,
    required: true,
    min: [0, 'Valor total não pode ser negativo']
  },
  taxaEntrega: {
    type: Number,
    default: 0
  },
  valorFinal: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDENTE', 'PAGO', 'CONFIRMADO', 'PREPARANDO', 'PRONTO', 'EM_ENTREGA', 'ENTREGUE', 'CANCELADO', 'FAILED_PAYMENT'],
    default: 'PENDENTE'
  },
  enderecoEntrega: {
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    complemento: String,
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    estado: { type: String, required: true },
    cep: { type: String, required: true }
  },
  observacoes: String,
  dataPedido: {
    type: Date,
    default: Date.now
  },
  dataConfirmacao: Date,
  dataEntrega: Date,
  paymentTransactionId: String,
  paymentMethod: String,
  paymentProvider: String,
  paymentAt: Date,
  paymentRefundedAt: Date,
  refundId: String
}, {
  timestamps: true
});

// Gerar número do pedido automaticamente
pedidoSchema.pre('validate', async function(next) {
  if (!this.numero) {
    const count = await mongoose.model('Pedido').countDocuments();
    this.numero = `PED${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Support custom collection name from environment
const collectionName = process.env.ORDERS_COLLECTION || 'pedidos';
module.exports = mongoose.model('Pedido', pedidoSchema, collectionName);