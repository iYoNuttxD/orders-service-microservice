const Avaliacao = require('../models/Avaliacao');

class AvaliacaoRepository {
  async findAll(filters = {}) {
    const query = {};
    
    if (filters.clienteId) {
      query.clienteId = filters.clienteId;
    }
    
    if (filters.restauranteId) {
      query.restauranteId = filters.restauranteId;
    }
    
    if (filters.nota) {
      query.nota = filters.nota;
    }
    
    return await Avaliacao.find(query)
      .populate('clienteId', 'nome')
      .populate('restauranteId', 'nome')
      .populate('pedidoId', 'numero')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Avaliacao.findById(id)
      .populate('clienteId')
      .populate('restauranteId')
      .populate('pedidoId');
  }

  async findByPedido(pedidoId) {
    return await Avaliacao.findOne({ pedidoId });
  }

  async create(data) {
    const avaliacao = new Avaliacao(data);
    return await avaliacao.save();
  }

  async update(id, data) {
    return await Avaliacao.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Avaliacao.findByIdAndDelete(id);
  }

  async getMediaRestaurante(restauranteId) {
    const result = await Avaliacao.aggregate([
      { $match: { restauranteId } },
      { 
        $group: { 
          _id: null, 
          media: { $avg: '$nota' },
          total: { $sum: 1 }
        } 
      }
    ]);
    
    return result[0] || { media: 0, total: 0 };
  }
}

module.exports = new AvaliacaoRepository();