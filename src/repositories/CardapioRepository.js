const Cardapio = require('../models/Cardapio');

class CardapioRepository {
  async findAll(filters = {}) {
    const query = {};
    
    if (filters.restauranteId) {
      query.restauranteId = filters.restauranteId;
    }
    
    if (filters.categoria) {
      query.categoria = filters.categoria;
    }
    
    if (filters.disponivel !== undefined) {
      query.disponivel = filters.disponivel;
    }
    
    if (filters.search) {
      query.$or = [
        { nome: { $regex: filters.search, $options: 'i' } },
        { descricao: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    return await Cardapio.find(query)
      .populate('restauranteId', 'nome categoria')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Cardapio.findById(id).populate('restauranteId');
  }

  async findByRestaurante(restauranteId) {
    return await Cardapio.find({ 
      restauranteId, 
      disponivel: true 
    }).sort({ categoria: 1, nome: 1 });
  }

  async create(data) {
    const cardapio = new Cardapio(data);
    return await cardapio.save();
  }

  async update(id, data) {
    return await Cardapio.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Cardapio.findByIdAndDelete(id);
  }

  async updateDisponibilidade(id, disponivel) {
    return await Cardapio.findByIdAndUpdate(
      id,
      { disponivel },
      { new: true }
    );
  }
}

module.exports = new CardapioRepository();