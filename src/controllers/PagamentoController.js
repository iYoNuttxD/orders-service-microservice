const PagamentoService = require('../services/PagamentoService');

class PagamentoController {
  async getAll(req, res, next) {
    try {
      const { status, metodo } = req.query;
      const pagamentos = await PagamentoService.getAllPagamentos({ status, metodo });
      
      res.json({
        success: true,
        data: pagamentos,
        total: pagamentos.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const pagamento = await PagamentoService.getPagamentoById(id);
      
      res.json({
        success: true,
        data: pagamento
      });
    } catch (error) {
      next(error);
    }
  }

  async getByPedido(req, res, next) {
    try {
      const { pedidoId } = req.params;
      const pagamento = await PagamentoService.getPagamentoByPedido(pedidoId);
      
      res.json({
        success: true,
        data: pagamento
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const pagamento = await PagamentoService.createPagamento(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Pagamento criado com sucesso',
        data: pagamento
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const pagamento = await PagamentoService.updatePagamentoStatus(id, status);
      
      res.json({
        success: true,
        message: 'Status do pagamento atualizado com sucesso',
        data: pagamento
      });
    } catch (error) {
      next(error);
    }
  }

  async processar(req, res, next) {
    try {
      const { id } = req.params;
      const resultado = await PagamentoService.processarPagamento(id);
      
      res.json({
        success: true,
        message: resultado.message
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelar(req, res, next) {
    try {
      const { id } = req.params;
      const pagamento = await PagamentoService.cancelarPagamento(id);
      
      res.json({
        success: true,
        message: 'Pagamento cancelado com sucesso',
        data: pagamento
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PagamentoController();