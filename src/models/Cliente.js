const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  cpf: {
    type: String,
    required: [true, 'CPF é obrigatório'],
    unique: true,
    trim: true,
    match: [/^\d{11}$/, 'CPF deve ter 11 dígitos']
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
  dataNascimento: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ATIVO', 'INATIVO', 'BLOQUEADO'],
    default: 'ATIVO'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para pedidos
clienteSchema.virtual('pedidos', {
  ref: 'Pedido',
  localField: '_id',
  foreignField: 'clienteId'
});

module.exports = mongoose.model('Cliente', clienteSchema);