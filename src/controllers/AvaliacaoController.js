const AvaliacaoService = require('../services/AvaliacaoService');

class AvaliacaoController {
  async getAll(req, res, next) {
    try {
      const { clienteId, restauranteId, nota } = req.query;
      const avaliacoes = await AvaliacaoService.getAllAvaliacoes({ 
        clienteId, 
        restauranteId, 
        nota: nota ? parseInt(nota) : undefined
      });
      
      res.json({
        success: true,
        data: avaliacoes,
        total: avaliacoes.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const avaliacao = await AvaliacaoService.getAvaliacaoById(id);
      
      res.json({
        success: true,
        data: avaliacao
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const avaliacao = await AvaliacaoService.createAvaliacao(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Avaliação criada com sucesso',
        data: avaliacao
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const avaliacao = await AvaliacaoService.updateAvaliacao(id, req.body);
      
      res.json({
        success: true,
        message: 'Avaliação atualizada com sucesso',
        data: avaliacao
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await AvaliacaoService.deleteAvaliacao(id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getMediaRestaurante(req, res, next) {
    try {
      const { restauranteId } = req.params;
      const resultado = await AvaliacaoService.getMediaRestaurante(restauranteId);
      
      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AvaliacaoController();