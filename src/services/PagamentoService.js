const PagamentoRepository = require('../repositories/PagamentoRepository');
const PedidoRepository = require('../repositories/PedidoRepository');
const logger = require('../utils/logger');

class PagamentoService {
  async getAllPagamentos(filters = {}) {
    try {
      logger.info('Buscando todos os pagamentos', { filters });
      const pagamentos = await PagamentoRepository.findAll(filters);
      return pagamentos;
    } catch (error) {
      logger.error('Erro ao buscar pagamentos', { error: error.message });
      throw error;
    }
  }

  async getPagamentoById(id) {
    try {
      logger.info('Buscando pagamento por ID', { id });
      const pagamento = await PagamentoRepository.findById(id);
      
      if (!pagamento) {
        const error = new Error('Pagamento não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      return pagamento;
    } catch (error) {
      logger.error('Erro ao buscar pagamento', { id, error: error.message });
      throw error;
    }
  }

  async getPagamentoByPedido(pedidoId) {
    try {
      logger.info('Buscando pagamento por pedido', { pedidoId });
      
      const pagamento = await PagamentoRepository.findByPedido(pedidoId);
      
      if (!pagamento) {
        const error = new Error('Pagamento não encontrado para este pedido');
        error.statusCode = 404;
        throw error;
      }
      
      return pagamento;
    } catch (error) {
      logger.error('Erro ao buscar pagamento por pedido', { pedidoId, error: error.message });
      throw error;
    }
  }

  async createPagamento(data) {
    try {
      logger.info('Criando novo pagamento', { pedidoId: data.pedidoId });
      
      // Verificar se pedido existe
      const pedido = await PedidoRepository.findById(data.pedidoId);
      if (!pedido) {
        const error = new Error('Pedido não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      // Verificar se pedido foi confirmado
      if (pedido.status === 'PENDENTE') {
        const error = new Error('Pedido ainda não foi confirmado');
        error.statusCode = 400;
        throw error;
      }
      
      // Verificar se já existe pagamento para este pedido
      const pagamentoExistente = await PagamentoRepository.findByPedido(data.pedidoId);
      if (pagamentoExistente) {
        const error = new Error('Já existe um pagamento para este pedido');
        error.statusCode = 409;
        throw error;
      }
      
      // Validar valor do pagamento
      if (data.valor !== pedido.valorFinal) {
        const error = new Error(`Valor do pagamento (${data.valor}) não corresponde ao valor do pedido (${pedido.valorFinal})`);
        error.statusCode = 400;
        throw error;
      }
      
      const pagamento = await PagamentoRepository.create(data);
      logger.info('Pagamento criado com sucesso', { id: pagamento._id });
      
      return pagamento;
    } catch (error) {
      logger.error('Erro ao criar pagamento', { error: error.message });
      throw error;
    }
  }

  async updatePagamentoStatus(id, status) {
    try {
      logger.info('Atualizando status do pagamento', { id, status });
      
      const pagamento = await this.getPagamentoById(id);
      
      // Validar transições de status
      const validTransitions = {
        'PENDENTE': ['PROCESSANDO', 'CANCELADO'],
        'PROCESSANDO': ['APROVADO', 'RECUSADO'],
        'APROVADO': [],
        'RECUSADO': [],
        'CANCELADO': []
      };
      
      if (!validTransitions[pagamento.status].includes(status)) {
        const error = new Error(`Transição inválida de ${pagamento.status} para ${status}`);
        error.statusCode = 400;
        throw error;
      }
      
      const pagamentoAtualizado = await PagamentoRepository.updateStatus(id, status);
      logger.info('Status do pagamento atualizado com sucesso', { id, status });
      
      // Se pagamento foi aprovado, atualizar status do pedido
      if (status === 'APROVADO') {
        const pedido = await PedidoRepository.findById(pagamento.pedidoId);
        if (pedido.status === 'CONFIRMADO') {
          await PedidoRepository.updateStatus(pagamento.pedidoId, 'PREPARANDO');
          logger.info('Status do pedido atualizado para PREPARANDO', { pedidoId: pagamento.pedidoId });
        }
      }
      
      return pagamentoAtualizado;
    } catch (error) {
      logger.error('Erro ao atualizar status do pagamento', { id, error: error.message });
      throw error;
    }
  }

  async processarPagamento(id) {
    try {
      logger.info('Processando pagamento', { id });
      
      const pagamento = await this.getPagamentoById(id);
      
      if (pagamento.status !== 'PENDENTE') {
        const error = new Error('Apenas pagamentos pendentes podem ser processados');
        error.statusCode = 400;
        throw error;
      }
      
      // Simular processamento (em produção, aqui seria integração com gateway de pagamento)
      await this.updatePagamentoStatus(id, 'PROCESSANDO');
      
      // Simular aprovação automática após 2 segundos (remover em produção)
      setTimeout(async () => {
        try {
          await this.updatePagamentoStatus(id, 'APROVADO');
          logger.info('Pagamento aprovado automaticamente', { id });
        } catch (err) {
          logger.error('Erro ao aprovar pagamento automaticamente', { id, error: err.message });
        }
      }, 2000);
      
      return { message: 'Pagamento está sendo processado' };
    } catch (error) {
      logger.error('Erro ao processar pagamento', { id, error: error.message });
      throw error;
    }
  }

  async cancelarPagamento(id) {
    try {
      logger.info('Cancelando pagamento', { id });
      
      const pagamento = await this.getPagamentoById(id);
      
      if (['APROVADO', 'CANCELADO'].includes(pagamento.status)) {
        const error = new Error('Pagamento não pode ser cancelado');
        error.statusCode = 400;
        throw error;
      }
      
      return await this.updatePagamentoStatus(id, 'CANCELADO');
    } catch (error) {
      logger.error('Erro ao cancelar pagamento', { id, error: error.message });
      throw error;
    }
  }
}

module.exports = new PagamentoService();