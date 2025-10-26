const PedidoService = require('../../src/services/PedidoService');
const PedidoRepository = require('../../src/repositories/PedidoRepository');
const ClienteRepository = require('../../src/repositories/ClienteRepository');
const RestauranteRepository = require('../../src/repositories/RestauranteRepository');
const CardapioRepository = require('../../src/repositories/CardapioRepository');

jest.mock('../../src/repositories/PedidoRepository');
jest.mock('../../src/repositories/ClienteRepository');
jest.mock('../../src/repositories/RestauranteRepository');
jest.mock('../../src/repositories/CardapioRepository');

describe('PedidoService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPedido', () => {
    it('Deve criar um pedido com sucesso', async () => {
      const mockCliente = {
        _id: 'cliente123',
        nome: 'João Silva',
        status: 'ATIVO',
        endereco: {
          rua: 'Rua Teste',
          numero: '100',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      };

      const mockRestaurante = {
        _id: 'restaurante123',
        nome: 'Pizzaria',
        status: 'ATIVO'
      };

      const mockCardapio = {
        _id: 'cardapio123',
        nome: 'Pizza Margherita',
        preco: 45.90,
        disponivel: true
      };

      const mockPedidoData = {
        clienteId: 'cliente123',
        restauranteId: 'restaurante123',
        items: [
          {
            cardapioId: 'cardapio123',
            quantidade: 2
          }
        ]
      };

      const mockPedidoCriado = {
        _id: 'pedido123',
        numero: 'PED000001',
        ...mockPedidoData,
        valorTotal: 91.80,
        taxaEntrega: 5.00,
        valorFinal: 96.80
      };

      ClienteRepository.findById.mockResolvedValue(mockCliente);
      RestauranteRepository.findById.mockResolvedValue(mockRestaurante);
      CardapioRepository.findById.mockResolvedValue(mockCardapio);
      PedidoRepository.create.mockResolvedValue(mockPedidoCriado);

      const result = await PedidoService.createPedido(mockPedidoData);

      expect(result).toHaveProperty('numero');
      expect(result.valorTotal).toBe(91.80);
      expect(result.valorFinal).toBe(96.80);
    });

    it('Deve rejeitar pedido com cliente inexistente', async () => {
      const mockPedidoData = {
        clienteId: 'cliente123',
        restauranteId: 'restaurante123',
        items: []
      };

      ClienteRepository.findById.mockResolvedValue(null);

      await expect(PedidoService.createPedido(mockPedidoData))
        .rejects
        .toThrow('Cliente não encontrado');
    });

    it('Deve rejeitar pedido com restaurante inativo', async () => {
      const mockCliente = { _id: 'cliente123' };
      const mockRestaurante = { _id: 'restaurante123', status: 'INATIVO' };

      const mockPedidoData = {
        clienteId: 'cliente123',
        restauranteId: 'restaurante123',
        items: []
      };

      ClienteRepository.findById.mockResolvedValue(mockCliente);
      RestauranteRepository.findById.mockResolvedValue(mockRestaurante);

      await expect(PedidoService.createPedido(mockPedidoData))
        .rejects
        .toThrow('Restaurante não está ativo');
    });

    it('Deve rejeitar pedido com item indisponível', async () => {
      const mockCliente = { _id: 'cliente123', status: 'ATIVO' };
      const mockRestaurante = { _id: 'restaurante123', status: 'ATIVO' };
      const mockCardapio = {
        _id: 'cardapio123',
        nome: 'Pizza',
        preco: 45.90,
        disponivel: false
      };

      const mockPedidoData = {
        clienteId: 'cliente123',
        restauranteId: 'restaurante123',
        items: [
          {
            cardapioId: 'cardapio123',
            quantidade: 1
          }
        ]
      };

      ClienteRepository.findById.mockResolvedValue(mockCliente);
      RestauranteRepository.findById.mockResolvedValue(mockRestaurante);
      CardapioRepository.findById.mockResolvedValue(mockCardapio);

      await expect(PedidoService.createPedido(mockPedidoData))
        .rejects
        .toThrow('Item não disponível: Pizza');
    });
  });

  describe('updatePedidoStatus', () => {
    it('Deve atualizar status do pedido', async () => {
      const mockPedido = {
        _id: 'pedido123',
        status: 'PENDENTE'
      };

      PedidoRepository.findById.mockResolvedValue(mockPedido);
      PedidoRepository.updateStatus.mockResolvedValue({
        ...mockPedido,
        status: 'CONFIRMADO'
      });

      const result = await PedidoService.updatePedidoStatus('pedido123', 'CONFIRMADO');

      expect(result.status).toBe('CONFIRMADO');
    });

    it('Deve rejeitar transição inválida de status', async () => {
      const mockPedido = {
        _id: 'pedido123',
        status: 'ENTREGUE'
      };

      PedidoRepository.findById.mockResolvedValue(mockPedido);

      await expect(PedidoService.updatePedidoStatus('pedido123', 'CONFIRMADO'))
        .rejects
        .toThrow('Transição inválida');
    });
  });

  describe('cancelarPedido', () => {
    it('Deve cancelar um pedido pendente', async () => {
      const mockPedido = {
        _id: 'pedido123',
        status: 'PENDENTE'
      };

      PedidoRepository.findById.mockResolvedValue(mockPedido);
      PedidoRepository.updateStatus.mockResolvedValue({
        ...mockPedido,
        status: 'CANCELADO'
      });

      const result = await PedidoService.cancelarPedido('pedido123');

      expect(result.status).toBe('CANCELADO');
    });

    it('Deve rejeitar cancelamento de pedido já entregue', async () => {
      const mockPedido = {
        _id: 'pedido123',
        status: 'ENTREGUE'
      };

      PedidoRepository.findById.mockResolvedValue(mockPedido);

      await expect(PedidoService.cancelarPedido('pedido123'))
        .rejects
        .toThrow('Pedido não pode ser cancelado');
    });
  });
});