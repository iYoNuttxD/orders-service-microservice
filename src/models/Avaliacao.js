const mongoose = require('mongoose');

const avaliacaoSchema = new mongoose.Schema({
  pedidoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true,
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
  nota: {
    type: Number,
    required: [true, 'Nota é obrigatória'],
    min: [1, 'Nota mínima é 1'],
    max: [5, 'Nota máxima é 5']
  },
  comentario: {
    type: String,
    maxlength: [500, 'Comentário não pode ter mais de 500 caracteres']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Avaliacao', avaliacaoSchema);