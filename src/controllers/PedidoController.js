const PedidoService = require('../services/PedidoService');

class PedidoController {
  async getAll(req, res, next) {
    try {
      const { clienteId, restauranteId, status, dataInicio, dataFim } = req.query;
      const pedidos = await PedidoService.getAllPedidos({ 
        clienteId, 
        restauranteId, 
        status,
        dataInicio,
        dataFim
      });
      
      res.json({
        success: true,
        data: pedidos,
        total: pedidos.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const pedido = await PedidoService.getPedidoById(id);
      
      res.json({
        success: true,
        data: pedido
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const pedido = await PedidoService.createPedido(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Pedido criado com sucesso',
        data: pedido
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const pedido = await PedidoService.updatePedidoStatus(id, status);
      
      res.json({
        success: true,
        message: 'Status do pedido atualizado com sucesso',
        data: pedido
      });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const pedido = await PedidoService.cancelarPedido(id);
      
      res.json({
        success: true,
        message: 'Pedido cancelado com sucesso',
        data: pedido
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const stats = await PedidoService.getDashboardStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PedidoController();