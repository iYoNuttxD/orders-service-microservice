const mongoose = require('mongoose');

const cardapioSchema = new mongoose.Schema({
  restauranteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurante',
    required: true
  },
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  descricao: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  preco: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: [0, 'Preço não pode ser negativo']
  },
  categoria: {
    type: String,
    enum: ['ENTRADA', 'PRATO_PRINCIPAL', 'SOBREMESA', 'BEBIDA', 'LANCHE', 'OUTROS'],
    required: true
  },
  imagemUrl: String,
  disponivel: {
    type: Boolean,
    default: true
  },
  tempoPreparoMinutos: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cardapio', cardapioSchema);