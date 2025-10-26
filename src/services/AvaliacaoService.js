const AvaliacaoRepository = require('../repositories/AvaliacaoRepository');
const PedidoRepository = require('../repositories/PedidoRepository');
const ClienteRepository = require('../repositories/ClienteRepository');
const RestauranteRepository = require('../repositories/RestauranteRepository');
const logger = require('../utils/logger');

class AvaliacaoService {
  async getAllAvaliacoes(filters = {}) {
    try {
      logger.info('Buscando todas as avaliações', { filters });
      const avaliacoes = await AvaliacaoRepository.findAll(filters);
      return avaliacoes;
    } catch (error) {
      logger.error('Erro ao buscar avaliações', { error: error.message });
      throw error;
    }
  }

  async getAvaliacaoById(id) {
    try {
      logger.info('Buscando avaliação por ID', { id });
      const avaliacao = await AvaliacaoRepository.findById(id);
      
      if (!avaliacao) {
        const error = new Error('Avaliação não encontrada');
        error.statusCode = 404;
        throw error;
      }
      
      return avaliacao;
    } catch (error) {
      logger.error('Erro ao buscar avaliação', { id, error: error.message });
      throw error;
    }
  }

  async createAvaliacao(data) {
    try {
      logger.info('Criando nova avaliação', { pedidoId: data.pedidoId });
      
      // Verificar se pedido existe
      const pedido = await PedidoRepository.findById(data.pedidoId);
      if (!pedido) {
        const error = new Error('Pedido não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      // Verificar se pedido foi entregue
      if (pedido.status !== 'ENTREGUE') {
        const error = new Error('Apenas pedidos entregues podem ser avaliados');
        error.statusCode = 400;
        throw error;
      }
      
      // Verificar se pedido já foi avaliado
      const avaliacaoExistente = await AvaliacaoRepository.findByPedido(data.pedidoId);
      if (avaliacaoExistente) {
        const error = new Error('Este pedido já foi avaliado');
        error.statusCode = 409;
        throw error;
      }
      
      // Verificar se cliente existe
      const cliente = await ClienteRepository.findById(data.clienteId);
      if (!cliente) {
        const error = new Error('Cliente não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      // Verificar se cliente é o dono do pedido
      if (pedido.clienteId.toString() !== data.clienteId) {
        const error = new Error('Cliente não é o dono deste pedido');
        error.statusCode = 403;
        throw error;
      }
      
      // Verificar se restaurante existe
      const restaurante = await RestauranteRepository.findById(data.restauranteId);
      if (!restaurante) {
        const error = new Error('Restaurante não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      const avaliacao = await AvaliacaoRepository.create(data);
      logger.info('Avaliação criada com sucesso', { id: avaliacao._id });
      
      return avaliacao;
    } catch (error) {
      logger.error('Erro ao criar avaliação', { error: error.message });
      throw error;
    }
  }

  async updateAvaliacao(id, data) {
    try {
      logger.info('Atualizando avaliação', { id });
      
      // Verificar se existe
      await this.getAvaliacaoById(id);
      
      const avaliacao = await AvaliacaoRepository.update(id, data);
      logger.info('Avaliação atualizada com sucesso', { id });
      
      return avaliacao;
    } catch (error) {
      logger.error('Erro ao atualizar avaliação', { id, error: error.message });
      throw error;
    }
  }

  async deleteAvaliacao(id) {
    try {
      logger.info('Deletando avaliação', { id });
      
      // Verificar se existe
      await this.getAvaliacaoById(id);
      
      await AvaliacaoRepository.delete(id);
      logger.info('Avaliação deletada com sucesso', { id });
      
      return { message: 'Avaliação deletada com sucesso' };
    } catch (error) {
      logger.error('Erro ao deletar avaliação', { id, error: error.message });
      throw error;
    }
  }

  async getMediaRestaurante(restauranteId) {
    try {
      logger.info('Calculando média de avaliações do restaurante', { restauranteId });
      
      // Verificar se restaurante existe
      const restaurante = await RestauranteRepository.findById(restauranteId);
      if (!restaurante) {
        const error = new Error('Restaurante não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      const resultado = await AvaliacaoRepository.getMediaRestaurante(restauranteId);
      
      return {
        restauranteId,
        restauranteNome: restaurante.nome,
        mediaNotas: resultado.media ? resultado.media.toFixed(1) : 0,
        totalAvaliacoes: resultado.total
      };
    } catch (error) {
      logger.error('Erro ao calcular média de avaliações', { restauranteId, error: error.message });
      throw error;
    }
  }
}

module.exports = new AvaliacaoService();