const PedidoRepository = require('../repositories/PedidoRepository');
const CardapioRepository = require('../repositories/CardapioRepository');
const ClienteRepository = require('../repositories/ClienteRepository');
const RestauranteRepository = require('../repositories/RestauranteRepository');
const logger = require('../utils/logger');

class PedidoService {
  async getAllPedidos(filters = {}) {
    try {
      logger.info('Buscando todos os pedidos', { filters });
      const pedidos = await PedidoRepository.findAll(filters);
      return pedidos;
    } catch (error) {
      logger.error('Erro ao buscar pedidos', { error: error.message });
      throw error;
    }
  }

  async getPedidoById(id) {
    try {
      logger.info('Buscando pedido por ID', { id });
      const pedido = await PedidoRepository.findById(id);
      
      if (!pedido) {
        const error = new Error('Pedido não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      return pedido;
    } catch (error) {
      logger.error('Erro ao buscar pedido', { id, error: error.message });
      throw error;
    }
  }

  async createPedido(data) {
    try {
      logger.info('Criando novo pedido', { clienteId: data.clienteId });
      
      // Verificar se cliente existe
      const cliente = await ClienteRepository.findById(data.clienteId);
      if (!cliente) {
        const error = new Error('Cliente não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
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
      
      // Processar items e calcular valores
      const itemsProcessados = [];
      let valorTotal = 0;
      
      for (const item of data.items) {
        const cardapio = await CardapioRepository.findById(item.cardapioId);
        
        if (!cardapio) {
          const error = new Error(`Item do cardápio não encontrado: ${item.cardapioId}`);
          error.statusCode = 404;
          throw error;
        }
        
        if (!cardapio.disponivel) {
          const error = new Error(`Item não disponível: ${cardapio.nome}`);
          error.statusCode = 400;
          throw error;
        }
        
        const subtotal = cardapio.preco * item.quantidade;
        valorTotal += subtotal;
        
        itemsProcessados.push({
          cardapioId: cardapio._id,
          nome: cardapio.nome,
          quantidade: item.quantidade,
          precoUnitario: cardapio.preco,
          subtotal
        });
      }
      
      // Adicionar taxa de entrega
      const taxaEntrega = data.taxaEntrega || 5.00;
      const valorFinal = valorTotal + taxaEntrega;
      
      const pedidoData = {
        ...data,
        items: itemsProcessados,
        valorTotal,
        taxaEntrega,
        valorFinal,
        enderecoEntrega: data.enderecoEntrega || cliente.endereco
      };
      
      const pedido = await PedidoRepository.create(pedidoData);
      logger.info('Pedido criado com sucesso', { id: pedido._id, numero: pedido.numero });
      
      return pedido;
    } catch (error) {
      logger.error('Erro ao criar pedido', { error: error.message });
      throw error;
    }
  }

  async updatePedidoStatus(id, status) {
    try {
      logger.info('Atualizando status do pedido', { id, status });
      
      const pedido = await this.getPedidoById(id);
      
      // Validar transições de status
      const validTransitions = {
        'PENDENTE': ['CONFIRMADO', 'CANCELADO'],
        'CONFIRMADO': ['PREPARANDO', 'CANCELADO'],
        'PREPARANDO': ['PRONTO', 'CANCELADO'],
        'PRONTO': ['EM_ENTREGA'],
        'EM_ENTREGA': ['ENTREGUE'],
        'ENTREGUE': [],
        'CANCELADO': []
      };
      
      if (!validTransitions[pedido.status].includes(status)) {
        const error = new Error(`Transição inválida de ${pedido.status} para ${status}`);
        error.statusCode = 400;
        throw error;
      }
      
      const pedidoAtualizado = await PedidoRepository.updateStatus(id, status);
      logger.info('Status do pedido atualizado com sucesso', { id, status });
      
      return pedidoAtualizado;
    } catch (error) {
      logger.error('Erro ao atualizar status do pedido', { id, error: error.message });
      throw error;
    }
  }

  async cancelarPedido(id) {
    try {
      logger.info('Cancelando pedido', { id });
      
      const pedido = await this.getPedidoById(id);
      
      if (['ENTREGUE', 'CANCELADO'].includes(pedido.status)) {
        const error = new Error('Pedido não pode ser cancelado');
        error.statusCode = 400;
        throw error;
      }
      
      return await this.updatePedidoStatus(id, 'CANCELADO');
    } catch (error) {
      logger.error('Erro ao cancelar pedido', { id, error: error.message });
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      const [
        totalPendentes,
        totalConfirmados,
        totalEntregues,
        totalVendas
      ] = await Promise.all([
        PedidoRepository.countByStatus('PENDENTE'),
        PedidoRepository.countByStatus('CONFIRMADO'),
        PedidoRepository.countByStatus('ENTREGUE'),
        PedidoRepository.getTotalVendas()
      ]);
      
      return {
        totalPendentes,
        totalConfirmados,
        totalEntregues,
        totalVendas
      };
    } catch (error) {
      logger.error('Erro ao buscar estatísticas', { error: error.message });
      throw error;
    }
  }
}

module.exports = new PedidoService();