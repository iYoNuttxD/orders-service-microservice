const mongoose = require('mongoose');

const restauranteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  cnpj: {
    type: String,
    required: [true, 'CNPJ é obrigatório'],
    unique: true,
    trim: true,
    match: [/^\d{14}$/, 'CNPJ deve ter 14 dígitos']
  },
  endereco: {
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    complemento: String,
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    estado: { type: String, required: true },
    cep: { type: String, required: true }
  },
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true
  },
  categoria: {
    type: String,
    enum: ['BRASILEIRA', 'ITALIANA', 'JAPONESA', 'LANCHES', 'PIZZARIA', 'SOBREMESAS', 'OUTROS'],
    required: true
  },
  horarioFuncionamento: {
    abertura: { type: String, required: true }, // "08:00"
    fechamento: { type: String, required: true } // "22:00"
  },
  imagemUrl: String,
  status: {
    type: String,
    enum: ['ATIVO', 'INATIVO', 'FECHADO'],
    default: 'ATIVO'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para cardápios
restauranteSchema.virtual('cardapios', {
  ref: 'Cardapio',
  localField: '_id',
  foreignField: 'restauranteId'
});

module.exports = mongoose.model('Restaurante', restauranteSchema);