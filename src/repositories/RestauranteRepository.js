const Restaurante = require('../models/Restaurante');

class RestauranteRepository {
  async findAll(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.categoria) {
      query.categoria = filters.categoria;
    }
    
    if (filters.search) {
      query.$or = [
        { nome: { $regex: filters.search, $options: 'i' } },
        { 'endereco.cidade': { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    return await Restaurante.find(query).sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Restaurante.findById(id).populate('cardapios');
  }

  async findByCnpj(cnpj) {
    return await Restaurante.findOne({ cnpj });
  }

  async create(data) {
    const restaurante = new Restaurante(data);
    return await restaurante.save();
  }

  async update(id, data) {
    return await Restaurante.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Restaurante.findByIdAndDelete(id);
  }

  async findByCategoria(categoria) {
    return await Restaurante.find({ categoria, status: 'ATIVO' });
  }
}

module.exports = new RestauranteRepository();