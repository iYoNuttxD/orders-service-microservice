const Cliente = require('../models/Cliente');

class ClienteRepository {
  async findAll(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.search) {
      query.$or = [
        { nome: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    return await Cliente.find(query).sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Cliente.findById(id);
  }

  async findByEmail(email) {
    return await Cliente.findOne({ email: email.toLowerCase() });
  }

  async findByCpf(cpf) {
    return await Cliente.findOne({ cpf });
  }

  async create(data) {
    const cliente = new Cliente(data);
    return await cliente.save();
  }

  async update(id, data) {
    return await Cliente.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await Cliente.findByIdAndDelete(id);
  }

  async countByStatus(status) {
    return await Cliente.countDocuments({ status });
  }
}

module.exports = new ClienteRepository();