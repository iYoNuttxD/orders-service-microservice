const Pedido = require('../models/Pedido');

class PedidoRepository {
  async findAll(filters = {}) {
    const query = {};
    
    if (filters.clienteId) {
      query.clienteId = filters.clienteId;
    }
    
    if (filters.restauranteId) {
      query.restauranteId = filters.restauranteId;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.dataInicio && filters.dataFim) {
      query.dataPedido = {
        $gte: new Date(filters.dataInicio),
        $lte: new Date(filters.dataFim)
      };
    }
    
    return await Pedido.find(query)
      .populate('clienteId', 'nome email telefone')
      .populate('restauranteId', 'nome telefone')
      .populate('items.cardapioId', 'nome')
      .sort({ dataPedido: -1 });
  }

  async findById(id) {
    return await Pedido.findById(id)
      .populate('clienteId')
      .populate('restauranteId')
      .populate('items.cardapioId');
  }

  async findByNumero(numero) {
    return await Pedido.findOne({ numero })
      .populate('clienteId')
      .populate('restauranteId')
      .populate('items.cardapioId');
  }

  async create(data) {
    const pedido = new Pedido(data);
    return await pedido.save();
  }

  async update(id, data) {
    return await Pedido.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async updateStatus(id, status) {
    const update = { status };
    
    if (status === 'CONFIRMADO') {
      update.dataConfirmacao = new Date();
    }
    
    if (status === 'ENTREGUE') {
      update.dataEntrega = new Date();
    }
    
    return await Pedido.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );
  }

  async delete(id) {
    return await Pedido.findByIdAndDelete(id);
  }

  async countByStatus(status) {
    return await Pedido.countDocuments({ status });
  }

  async getTotalVendas(restauranteId = null) {
    const match = { status: 'ENTREGUE' };
    
    if (restauranteId) {
      match.restauranteId = restauranteId;
    }
    
    const result = await Pedido.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$valorFinal' } } }
    ]);
    
    return result[0]?.total || 0;
  }
}

module.exports = new PedidoRepository();