const request = require('supertest');
const app = require('../../src/app');
const Cliente = require('../../src/models/Cliente');
const Restaurante = require('../../src/models/Restaurante');
const Cardapio = require('../../src/models/Cardapio');
const Pedido = require('../../src/models/Pedido');

// Função auxiliar para gerar CPF único
function gerarCpf() {
  const random = Math.floor(Math.random() * 100000000000);
  return String(random).padStart(11, '0');
}

// Função auxiliar para gerar CNPJ único
function gerarCnpj() {
  const random = Math.floor(Math.random() * 10000000000000);
  return String(random).padStart(14, '0');
}

describe('Pedidos API - Integration Tests', () => {
  let cliente, restaurante, cardapio, pedido;

  beforeEach(async () => {
    // Criar dados de teste
    cliente = await Cliente.create({
      nome: 'Cliente Teste',
      email: `cliente${Date.now()}@test.com`,
      telefone: '11999999999',
      cpf: gerarCpf(),
      endereco: {
        rua: 'Rua Teste',
        numero: '100',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01000000'
      }
    });

    restaurante = await Restaurante.create({
      nome: 'Restaurante Teste',
      cnpj: gerarCnpj(),
      email: `restaurante${Date.now()}@test.com`,
      telefone: '1133333333',
      categoria: 'BRASILEIRA',
      horarioFuncionamento: {
        abertura: '08:00',
        fechamento: '22:00'
      },
      endereco: {
        rua: 'Rua Restaurante',
        numero: '200',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01000000'
      }
    });

    cardapio = await Cardapio.create({
      restauranteId: restaurante._id,
      nome: 'Prato Teste',
      descricao: 'Descrição do prato',
      preco: 25.00,
      categoria: 'PRATO_PRINCIPAL',
      disponivel: true
    });
  });

  describe('POST /api/v1/pedidos', () => {
    it('Deve criar um novo pedido', async () => {
      const newPedido = {
        clienteId: cliente._id.toString(),
        restauranteId: restaurante._id.toString(),
        items: [
          {
            cardapioId: cardapio._id.toString(),
            quantidade: 2
          }
        ],
        taxaEntrega: 5.00
      };

      const response = await request(app)
        .post('/api/v1/pedidos')
        .send(newPedido)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('numero');
      expect(response.body.data.valorTotal).toBe(50.00);
      expect(response.body.data.valorFinal).toBe(55.00);
      expect(response.body.data.status).toBe('PENDENTE');

      pedido = response.body.data;
    });

    it('Deve retornar erro ao criar pedido com item indisponível', async () => {
      // Tornar item indisponível
      cardapio.disponivel = false;
      await cardapio.save();

      const newPedido = {
        clienteId: cliente._id.toString(),
        restauranteId: restaurante._id.toString(),
        items: [
          {
            cardapioId: cardapio._id.toString(),
            quantidade: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/pedidos')
        .send(newPedido)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('não disponível');
    });

    it('Deve retornar erro de validação para pedido sem itens', async () => {
      const newPedido = {
        clienteId: cliente._id.toString(),
        restauranteId: restaurante._id.toString(),
        items: []
      };

      const response = await request(app)
        .post('/api/v1/pedidos')
        .send(newPedido)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/pedidos', () => {
    beforeEach(async () => {
      // Criar pedido para os testes
      const count = await Pedido.countDocuments();
      pedido = await Pedido.create({
        numero: `PED${String(count + 1).padStart(6, '0')}`,
        clienteId: cliente._id,
        restauranteId: restaurante._id,
        items: [
          {
            cardapioId: cardapio._id,
            nome: cardapio.nome,
            quantidade: 2,
            precoUnitario: cardapio.preco,
            subtotal: 50.00
          }
        ],
        valorTotal: 50.00,
        taxaEntrega: 5.00,
        valorFinal: 55.00,
        enderecoEntrega: cliente.endereco
      });
    });

    it('Deve listar todos os pedidos', async () => {
      const response = await request(app)
        .get('/api/v1/pedidos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('Deve filtrar pedidos por cliente', async () => {
      const response = await request(app)
        .get(`/api/v1/pedidos?clienteId=${cliente._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('Deve filtrar pedidos por status', async () => {
      const response = await request(app)
        .get('/api/v1/pedidos?status=PENDENTE')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(p => {
        expect(p.status).toBe('PENDENTE');
      });
    });
  });

  describe('GET /api/v1/pedidos/dashboard', () => {
    it('Deve retornar estatísticas do dashboard', async () => {
      const response = await request(app)
        .get('/api/v1/pedidos/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPendentes');
      expect(response.body.data).toHaveProperty('totalConfirmados');
      expect(response.body.data).toHaveProperty('totalEntregues');
      expect(response.body.data).toHaveProperty('totalVendas');
    });
  });

  describe('PATCH /api/v1/pedidos/:id/status', () => {
    beforeEach(async () => {
      const count = await Pedido.countDocuments();
      pedido = await Pedido.create({
        numero: `PED${String(count + 1).padStart(6, '0')}`,
        clienteId: cliente._id,
        restauranteId: restaurante._id,
        items: [
          {
            cardapioId: cardapio._id,
            nome: cardapio.nome,
            quantidade: 1,
            precoUnitario: cardapio.preco,
            subtotal: 25.00
          }
        ],
        valorTotal: 25.00,
        taxaEntrega: 5.00,
        valorFinal: 30.00,
        enderecoEntrega: cliente.endereco
      });
    });

    it('Deve atualizar status do pedido', async () => {
      const response = await request(app)
        .patch(`/api/v1/pedidos/${pedido._id}/status`)
        .send({ status: 'CONFIRMADO' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CONFIRMADO');
      expect(response.body.data.dataConfirmacao).toBeDefined();
    });

    it('Deve rejeitar transição inválida de status', async () => {
      // Mudar para ENTREGUE
      pedido.status = 'ENTREGUE';
      await pedido.save();

      const response = await request(app)
        .patch(`/api/v1/pedidos/${pedido._id}/status`)
        .send({ status: 'CONFIRMADO' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Transição inválida');
    });
  });

  describe('PATCH /api/v1/pedidos/:id/cancelar', () => {
    beforeEach(async () => {
      const count = await Pedido.countDocuments();
      pedido = await Pedido.create({
        numero: `PED${String(count + 1).padStart(6, '0')}`,
        clienteId: cliente._id,
        restauranteId: restaurante._id,
        items: [
          {
            cardapioId: cardapio._id,
            nome: cardapio.nome,
            quantidade: 1,
            precoUnitario: cardapio.preco,
            subtotal: 25.00
          }
        ],
        valorTotal: 25.00,
        taxaEntrega: 5.00,
        valorFinal: 30.00,
        enderecoEntrega: cliente.endereco
      });
    });

    it('Deve cancelar um pedido', async () => {
      const response = await request(app)
        .patch(`/api/v1/pedidos/${pedido._id}/cancelar`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELADO');
    });

    it('Deve rejeitar cancelamento de pedido já entregue', async () => {
      pedido.status = 'ENTREGUE';
      await pedido.save();

      const response = await request(app)
        .patch(`/api/v1/pedidos/${pedido._id}/cancelar`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});