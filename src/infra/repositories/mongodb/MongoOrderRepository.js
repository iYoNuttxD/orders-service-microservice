const Order = require('../../../domain/entities/Order');
const OrderRepositoryPort = require('../../../domain/ports/OrderRepository');
const Pedido = require('../../../models/Pedido');

/**
 * MongoDB OrderRepository Implementation
 * Implements the OrderRepository port using Mongoose
 */
class MongoOrderRepository extends OrderRepositoryPort {
  constructor() {
    super();
  }

  /**
   * Convert Mongoose document to domain Order entity
   */
  _toDomainEntity(doc) {
    if (!doc) return null;
    
    return new Order({
      id: doc._id.toString(),
      numero: doc.numero,
      clienteId: doc.clienteId?.toString(),
      restauranteId: doc.restauranteId?.toString(),
      items: doc.items || [],
      valorTotal: doc.valorTotal,
      taxaEntrega: doc.taxaEntrega,
      valorFinal: doc.valorFinal,
      status: doc.status,
      enderecoEntrega: doc.enderecoEntrega,
      observacoes: doc.observacoes,
      dataPedido: doc.dataPedido,
      dataConfirmacao: doc.dataConfirmacao,
      dataEntrega: doc.dataEntrega,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  async findById(id) {
    const doc = await Pedido.findById(id)
      .populate('clienteId', 'nome email telefone')
      .populate('restauranteId', 'nome endereco telefone');
    return this._toDomainEntity(doc);
  }

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
    
    if (filters.dataInicio || filters.dataFim) {
      query.dataPedido = {};
      if (filters.dataInicio) {
        query.dataPedido.$gte = new Date(filters.dataInicio);
      }
      if (filters.dataFim) {
        query.dataPedido.$lte = new Date(filters.dataFim);
      }
    }

    const docs = await Pedido.find(query)
      .populate('clienteId', 'nome email')
      .populate('restauranteId', 'nome')
      .sort({ dataPedido: -1 });
    
    return docs.map(doc => this._toDomainEntity(doc));
  }

  async create(orderData) {
    const pedido = new Pedido(orderData);
    const saved = await pedido.save();
    return this._toDomainEntity(saved);
  }

  async updateStatus(id, status) {
    const updates = { status };
    
    if (status === 'CONFIRMADO') {
      updates.dataConfirmacao = new Date();
    } else if (status === 'ENTREGUE') {
      updates.dataEntrega = new Date();
    }

    const updated = await Pedido.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('clienteId', 'nome email')
      .populate('restauranteId', 'nome');
    
    return this._toDomainEntity(updated);
  }

  async countByStatus(status) {
    return await Pedido.countDocuments({ status });
  }

  async getTotalVendas() {
    const result = await Pedido.aggregate([
      { $match: { status: 'ENTREGUE' } },
      { $group: { _id: null, total: { $sum: '$valorFinal' } } }
    ]);
    
    return result.length > 0 ? result[0].total : 0;
  }
}

module.exports = MongoOrderRepository;
