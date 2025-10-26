const RestauranteRepository = require('../repositories/RestauranteRepository');
const logger = require('../utils/logger');

class RestauranteService {
  async getAllRestaurantes(filters = {}) {
    try {
      logger.info('Buscando todos os restaurantes', { filters });
      const restaurantes = await RestauranteRepository.findAll(filters);
      return restaurantes;
    } catch (error) {
      logger.error('Erro ao buscar restaurantes', { error: error.message });
      throw error;
    }
  }

  async getRestauranteById(id) {
    try {
      logger.info('Buscando restaurante por ID', { id });
      const restaurante = await RestauranteRepository.findById(id);
      
      if (!restaurante) {
        const error = new Error('Restaurante não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      return restaurante;
    } catch (error) {
      logger.error('Erro ao buscar restaurante', { id, error: error.message });
      throw error;
    }
  }

  async createRestaurante(data) {
    try {
      logger.info('Criando novo restaurante', { cnpj: data.cnpj });
      
      // Validar se CNPJ já existe
      const existingCnpj = await RestauranteRepository.findByCnpj(data.cnpj);
      if (existingCnpj) {
        const error = new Error('CNPJ já cadastrado');
        error.statusCode = 409;
        throw error;
      }
      
      const restaurante = await RestauranteRepository.create(data);
      logger.info('Restaurante criado com sucesso', { id: restaurante._id });
      
      return restaurante;
    } catch (error) {
      logger.error('Erro ao criar restaurante', { error: error.message });
      throw error;
    }
  }

  async updateRestaurante(id, data) {
    try {
      logger.info('Atualizando restaurante', { id });
      
      // Verificar se existe
      await this.getRestauranteById(id);
      
      const restaurante = await RestauranteRepository.update(id, data);
      logger.info('Restaurante atualizado com sucesso', { id });
      
      return restaurante;
    } catch (error) {
      logger.error('Erro ao atualizar restaurante', { id, error: error.message });
      throw error;
    }
  }

  async deleteRestaurante(id) {
    try {
      logger.info('Deletando restaurante', { id });
      
      // Verificar se existe
      await this.getRestauranteById(id);
      
      await RestauranteRepository.delete(id);
      logger.info('Restaurante deletado com sucesso', { id });
      
      return { message: 'Restaurante deletado com sucesso' };
    } catch (error) {
      logger.error('Erro ao deletar restaurante', { id, error: error.message });
      throw error;
    }
  }

  async getRestaurantesByCategoria(categoria) {
    try {
      logger.info('Buscando restaurantes por categoria', { categoria });
      return await RestauranteRepository.findByCategoria(categoria);
    } catch (error) {
      logger.error('Erro ao buscar restaurantes por categoria', { error: error.message });
      throw error;
    }
  }
}

module.exports = new RestauranteService();