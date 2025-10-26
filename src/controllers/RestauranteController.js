const RestauranteService = require('../services/RestauranteService');

class RestauranteController {
  async getAll(req, res, next) {
    try {
      const { status, categoria, search } = req.query;
      const restaurantes = await RestauranteService.getAllRestaurantes({ 
        status, 
        categoria, 
        search 
      });
      
      res.json({
        success: true,
        data: restaurantes,
        total: restaurantes.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const restaurante = await RestauranteService.getRestauranteById(id);
      
      res.json({
        success: true,
        data: restaurante
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const restaurante = await RestauranteService.createRestaurante(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Restaurante criado com sucesso',
        data: restaurante
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const restaurante = await RestauranteService.updateRestaurante(id, req.body);
      
      res.json({
        success: true,
        message: 'Restaurante atualizado com sucesso',
        data: restaurante
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await RestauranteService.deleteRestaurante(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getByCategoria(req, res, next) {
    try {
      const { categoria } = req.params;
      const restaurantes = await RestauranteService.getRestaurantesByCategoria(categoria);
      
      res.json({
        success: true,
        data: restaurantes,
        total: restaurantes.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RestauranteController();