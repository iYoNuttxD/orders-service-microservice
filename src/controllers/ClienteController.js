const ClienteService = require('../services/ClienteService');

class ClienteController {
  async getAll(req, res, next) {
    try {
      const { status, search } = req.query;
      const clientes = await ClienteService.getAllClientes({ status, search });
      
      res.json({
        success: true,
        data: clientes,
        total: clientes.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const cliente = await ClienteService.getClienteById(id);
      
      res.json({
        success: true,
        data: cliente
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const cliente = await ClienteService.createCliente(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Cliente criado com sucesso',
        data: cliente
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const cliente = await ClienteService.updateCliente(id, req.body);
      
      res.json({
        success: true,
        message: 'Cliente atualizado com sucesso',
        data: cliente
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await ClienteService.deleteCliente(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClienteController();