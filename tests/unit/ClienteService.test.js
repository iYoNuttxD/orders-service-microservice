const ClienteService = require('../../src/services/ClienteService');
const ClienteRepository = require('../../src/repositories/ClienteRepository');

jest.mock('../../src/repositories/ClienteRepository');

describe('ClienteService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCliente', () => {
    it('Deve criar um cliente com dados válidos', async () => {
      const mockData = {
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '11987654321',
        cpf: '12345678901',
        endereco: {
          rua: 'Rua Teste',
          numero: '100',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      };

      ClienteRepository.findByEmail.mockResolvedValue(null);
      ClienteRepository.findByCpf.mockResolvedValue(null);
      ClienteRepository.create.mockResolvedValue({ 
        _id: '507f1f77bcf86cd799439011', 
        ...mockData 
      });

      const result = await ClienteService.createCliente(mockData);

      expect(result).toHaveProperty('_id');
      expect(result.nome).toBe(mockData.nome);
      expect(ClienteRepository.create).toHaveBeenCalledWith(mockData);
    });

    it('Deve rejeitar cliente com email duplicado', async () => {
      const mockData = {
        email: 'joao@example.com',
        cpf: '12345678901'
      };

      ClienteRepository.findByEmail.mockResolvedValue({ _id: '123' });

      await expect(ClienteService.createCliente(mockData))
        .rejects
        .toThrow('Email já cadastrado');
    });

    it('Deve rejeitar cliente com CPF duplicado', async () => {
      const mockData = {
        email: 'joao@example.com',
        cpf: '12345678901'
      };

      ClienteRepository.findByEmail.mockResolvedValue(null);
      ClienteRepository.findByCpf.mockResolvedValue({ _id: '123' });

      await expect(ClienteService.createCliente(mockData))
        .rejects
        .toThrow('CPF já cadastrado');
    });
  });

  describe('getClienteById', () => {
    it('Deve buscar um cliente por ID', async () => {
      const mockCliente = {
        _id: '507f1f77bcf86cd799439011',
        nome: 'João Silva',
        email: 'joao@example.com'
      };

      ClienteRepository.findById.mockResolvedValue(mockCliente);

      const result = await ClienteService.getClienteById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockCliente);
      expect(ClienteRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('Deve retornar erro 404 para cliente não encontrado', async () => {
      ClienteRepository.findById.mockResolvedValue(null);

      await expect(ClienteService.getClienteById('507f1f77bcf86cd799439011'))
        .rejects
        .toThrow('Cliente não encontrado');
    });
  });

  describe('updateCliente', () => {
    it('Deve atualizar um cliente', async () => {
      const mockCliente = {
        _id: '507f1f77bcf86cd799439011',
        nome: 'João Silva'
      };

      const updateData = {
        telefone: '11999999999'
      };

      ClienteRepository.findById.mockResolvedValue(mockCliente);
      ClienteRepository.update.mockResolvedValue({ 
        ...mockCliente, 
        ...updateData 
      });

      const result = await ClienteService.updateCliente('507f1f77bcf86cd799439011', updateData);

      expect(result.telefone).toBe(updateData.telefone);
    });
  });

  describe('deleteCliente', () => {
    it('Deve deletar um cliente', async () => {
      const mockCliente = {
        _id: '507f1f77bcf86cd799439011'
      };

      ClienteRepository.findById.mockResolvedValue(mockCliente);
      ClienteRepository.delete.mockResolvedValue(true);

      const result = await ClienteService.deleteCliente('507f1f77bcf86cd799439011');

      expect(result).toHaveProperty('message');
      expect(ClienteRepository.delete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});