const mongoose = require('mongoose');

const pagamentoSchema = new mongoose.Schema({
  pedidoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true,
    unique: true
  },
  valor: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0, 'Valor não pode ser negativo']
  },
  metodo: {
    type: String,
    enum: ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'VALE_REFEICAO'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDENTE', 'PROCESSANDO', 'APROVADO', 'RECUSADO', 'CANCELADO'],
    default: 'PENDENTE'
  },
  transacaoId: String,
  dataPagamento: Date,
  observacoes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Pagamento', pagamentoSchema);