const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Cliente = require('../../src/models/Cliente');

describe('Clientes API - Integration Tests', () => {
  let createdClienteId;
  let createdCliente;

  describe('POST /api/v1/clientes', () => {
    it('Deve criar um novo cliente', async () => {
      const newCliente = {
        nome: 'Test User',
        email: 'test@example.com',
        telefone: '11999999999',
        cpf: '99999999999',
        endereco: {
          rua: 'Rua Teste',
          numero: '100',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        },
        dataNascimento: '1990-01-01'
      };

      const response = await request(app)
        .post('/api/v1/clientes')
        .send(newCliente)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.nome).toBe(newCliente.nome);
      expect(response.body.data.email).toBe(newCliente.email);

      createdClienteId = response.body.data._id;
      createdCliente = response.body.data;
    });

    it('Deve retornar erro ao tentar criar cliente com email duplicado', async () => {
      // Criar primeiro cliente
      await Cliente.create({
        nome: 'Cliente Original',
        email: 'duplicate@example.com',
        telefone: '11888888888',
        cpf: '88888888888',
        endereco: {
          rua: 'Rua Teste',
          numero: '200',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      });

      const duplicateCliente = {
        nome: 'Test User 2',
        email: 'duplicate@example.com', // Mesmo email
        telefone: '11777777777',
        cpf: '77777777777',
        endereco: {
          rua: 'Rua Teste',
          numero: '300',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      };

      const response = await request(app)
        .post('/api/v1/clientes')
        .send(duplicateCliente)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Email já cadastrado');
    });

    it('Deve retornar erro de validação para dados inválidos', async () => {
      const invalidCliente = {
        nome: '',
        email: 'invalid-email',
        cpf: '123' // CPF inválido
      };

      const response = await request(app)
        .post('/api/v1/clientes')
        .send(invalidCliente)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/clientes', () => {
    beforeEach(async () => {
      // Criar cliente para testes
      createdCliente = await Cliente.create({
        nome: 'Cliente Teste GET',
        email: 'gettest@example.com',
        telefone: '11666666666',
        cpf: '66666666666',
        endereco: {
          rua: 'Rua Teste',
          numero: '400',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      });
      createdClienteId = createdCliente._id.toString();
    });

    it('Deve listar todos os clientes', async () => {
      const response = await request(app)
        .get('/api/v1/clientes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('Deve filtrar clientes por status', async () => {
      const response = await request(app)
        .get('/api/v1/clientes?status=ATIVO')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(cliente => {
        expect(cliente.status).toBe('ATIVO');
      });
    });

    it('Deve buscar clientes por termo de busca', async () => {
      const response = await request(app)
        .get('/api/v1/clientes?search=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/clientes/:id', () => {
    beforeEach(async () => {
      // Criar cliente para testes
      createdCliente = await Cliente.create({
        nome: 'Cliente Teste ID',
        email: 'idtest@example.com',
        telefone: '11555555555',
        cpf: '55555555555',
        endereco: {
          rua: 'Rua Teste',
          numero: '500',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      });
      createdClienteId = createdCliente._id.toString();
    });

    it('Deve buscar um cliente por ID', async () => {
      const response = await request(app)
        .get(`/api/v1/clientes/${createdClienteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(createdClienteId);
    });

    it('Deve retornar 404 para ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/v1/clientes/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('Deve retornar 400 para ID inválido', async () => {
      const response = await request(app)
        .get('/api/v1/clientes/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/clientes/:id', () => {
    beforeEach(async () => {
      // Criar cliente para testes
      createdCliente = await Cliente.create({
        nome: 'Cliente Teste PUT',
        email: 'puttest@example.com',
        telefone: '11444444444',
        cpf: '44444444444',
        endereco: {
          rua: 'Rua Teste',
          numero: '600',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      });
      createdClienteId = createdCliente._id.toString();
    });

    it('Deve atualizar um cliente', async () => {
      const updateData = {
        telefone: '11777777777'
      };

      const response = await request(app)
        .put(`/api/v1/clientes/${createdClienteId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.telefone).toBe(updateData.telefone);
    });

    it('Deve retornar erro ao atualizar com email duplicado', async () => {
      // Criar segundo cliente
      const cliente2 = await Cliente.create({
        nome: 'Cliente 2',
        email: 'cliente2@example.com',
        telefone: '11333333333',
        cpf: '33333333333',
        endereco: {
          rua: 'Rua Teste',
          numero: '700',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      });

      const updateData = {
        email: 'cliente2@example.com'
      };

      const response = await request(app)
        .put(`/api/v1/clientes/${createdClienteId}`)
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/clientes/:id', () => {
    beforeEach(async () => {
      // Criar cliente para testes
      createdCliente = await Cliente.create({
        nome: 'Cliente Teste DELETE',
        email: 'deletetest@example.com',
        telefone: '11222222222',
        cpf: '22222222222',
        endereco: {
          rua: 'Rua Teste',
          numero: '800',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      });
      createdClienteId = createdCliente._id.toString();
    });

    it('Deve deletar um cliente', async () => {
      await request(app)
        .delete(`/api/v1/clientes/${createdClienteId}`)
        .expect(204);

      // Verificar se foi deletado
      const cliente = await Cliente.findById(createdClienteId);
      expect(cliente).toBeNull();
    });

    it('Deve retornar 404 ao tentar deletar cliente inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/api/v1/clientes/${fakeId}`)
        .expect(404);
    });
  });
});