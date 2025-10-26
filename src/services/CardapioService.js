const CardapioRepository = require('../repositories/CardapioRepository');
const RestauranteRepository = require('../repositories/RestauranteRepository');
const logger = require('../utils/logger');

class CardapioService {
  async getAllCardapios(filters = {}) {
    try {
      logger.info('Buscando todos os cardápios', { filters });
      const cardapios = await CardapioRepository.findAll(filters);
      return cardapios;
    } catch (error) {
      logger.error('Erro ao buscar cardápios', { error: error.message });
      throw error;
    }
  }

  async getCardapioById(id) {
    try {
      logger.info('Buscando cardápio por ID', { id });
      const cardapio = await CardapioRepository.findById(id);
      
      if (!cardapio) {
        const error = new Error('Item do cardápio não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      return cardapio;
    } catch (error) {
      logger.error('Erro ao buscar cardápio', { id, error: error.message });
      throw error;
    }
  }

  async getCardapiosByRestaurante(restauranteId) {
    try {
      logger.info('Buscando cardápios por restaurante', { restauranteId });
      
      // Verificar se restaurante existe
      const restaurante = await RestauranteRepository.findById(restauranteId);
      if (!restaurante) {
        const error = new Error('Restaurante não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      const cardapios = await CardapioRepository.findByRestaurante(restauranteId);
      return cardapios;
    } catch (error) {
      logger.error('Erro ao buscar cardápios por restaurante', { restauranteId, error: error.message });
      throw error;
    }
  }

  async createCardapio(data) {
    try {
      logger.info('Criando novo item do cardápio', { restauranteId: data.restauranteId });
      
      // Verificar se restaurante existe
      const restaurante = await RestauranteRepository.findById(data.restauranteId);
      if (!restaurante) {
        const error = new Error('Restaurante não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      if (restaurante.status !== 'ATIVO') {
        const error = new Error('Restaurante não está ativo');
        error.statusCode = 400;
        throw error;
      }
      
      const cardapio = await CardapioRepository.create(data);
      logger.info('Item do cardápio criado com sucesso', { id: cardapio._id });
      
      return cardapio;
    } catch (error) {
      logger.error('Erro ao criar item do cardápio', { error: error.message });
      throw error;
    }
  }

  async updateCardapio(id, data) {
    try {
      logger.info('Atualizando item do cardápio', { id });
      
      // Verificar se existe
      await this.getCardapioById(id);
      
      const cardapio = await CardapioRepository.update(id, data);
      logger.info('Item do cardápio atualizado com sucesso', { id });
      
      return cardapio;
    } catch (error) {
      logger.error('Erro ao atualizar item do cardápio', { id, error: error.message });
      throw error;
    }
  }

  async deleteCardapio(id) {
    try {
      logger.info('Deletando item do cardápio', { id });
      
      // Verificar se existe
      await this.getCardapioById(id);
      
      await CardapioRepository.delete(id);
      logger.info('Item do cardápio deletado com sucesso', { id });
      
      return { message: 'Item do cardápio deletado com sucesso' };
    } catch (error) {
      logger.error('Erro ao deletar item do cardápio', { id, error: error.message });
      throw error;
    }
  }

  async toggleDisponibilidade(id) {
    try {
      logger.info('Alternando disponibilidade do item', { id });
      
      const cardapio = await this.getCardapioById(id);
      const novaDisponibilidade = !cardapio.disponivel;
      
      const cardapioAtualizado = await CardapioRepository.updateDisponibilidade(
        id, 
        novaDisponibilidade
      );
      
      logger.info('Disponibilidade alternada com sucesso', { 
        id, 
        disponivel: novaDisponibilidade 
      });
      
      return cardapioAtualizado;
    } catch (error) {
      logger.error('Erro ao alternar disponibilidade', { id, error: error.message });
      throw error;
    }
  }
}

module.exports = new CardapioService();