const CardapioService = require('../services/CardapioService');

class CardapioController {
  async getAll(req, res, next) {
    try {
      const { restauranteId, categoria, disponivel, search } = req.query;
      const cardapios = await CardapioService.getAllCardapios({ 
        restauranteId, 
        categoria, 
        disponivel: disponivel === 'true' ? true : disponivel === 'false' ? false : undefined,
        search 
      });
      
      res.json({
        success: true,
        data: cardapios,
        total: cardapios.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const cardapio = await CardapioService.getCardapioById(id);
      
      res.json({
        success: true,
        data: cardapio
      });
    } catch (error) {
      next(error);
    }
  }

  async getByRestaurante(req, res, next) {
    try {
      const { restauranteId } = req.params;
      const cardapios = await CardapioService.getCardapiosByRestaurante(restauranteId);
      
      res.json({
        success: true,
        data: cardapios,
        total: cardapios.length
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const cardapio = await CardapioService.createCardapio(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Item do cardápio criado com sucesso',
        data: cardapio
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const cardapio = await CardapioService.updateCardapio(id, req.body);
      
      res.json({
        success: true,
        message: 'Item do cardápio atualizado com sucesso',
        data: cardapio
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await CardapioService.deleteCardapio(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async toggleDisponibilidade(req, res, next) {
    try {
      const { id } = req.params;
      const cardapio = await CardapioService.toggleDisponibilidade(id);
      
      res.json({
        success: true,
        message: 'Disponibilidade alternada com sucesso',
        data: cardapio
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CardapioController();