const Pagamento = require('../models/Pagamento');

class PagamentoRepository {
  async findAll(filters = {}) {
    const query = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.metodo) {
      query.metodo = filters.metodo;
    }
    
    return await Pagamento.find(query)
      .populate('pedidoId', 'numero valorFinal')
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Pagamento.findById(id).populate('pedidoId');
  }

  async findByPedido(pedidoId) {
    return await Pagamento.findOne({ pedidoId });
  }

  async create(data) {
    const pagamento = new Pagamento(data);
    return await pagamento.save();
  }

  async update(id, data) {
    return await Pagamento.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async updateStatus(id, status) {
    const update = { status };
    
    if (status === 'APROVADO') {
      update.dataPagamento = new Date();
    }
    
    return await Pagamento.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );
  }

  async delete(id) {
    return await Pagamento.findByIdAndDelete(id);
  }
}

module.exports = new PagamentoRepository();