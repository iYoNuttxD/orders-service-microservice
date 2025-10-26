const ClienteRepository = require('../repositories/ClienteRepository');
const logger = require('../utils/logger');

class ClienteService {
  async getAllClientes(filters = {}) {
    try {
      logger.info('Buscando todos os clientes', { filters });
      const clientes = await ClienteRepository.findAll(filters);
      return clientes;
    } catch (error) {
      logger.error('Erro ao buscar clientes', { error: error.message });
      throw error;
    }
  }

  async getClienteById(id) {
    try {
      logger.info('Buscando cliente por ID', { id });
      const cliente = await ClienteRepository.findById(id);
      
      if (!cliente) {
        const error = new Error('Cliente não encontrado');
        error.statusCode = 404;
        throw error;
      }
      
      return cliente;
    } catch (error) {
      logger.error('Erro ao buscar cliente', { id, error: error.message });
      throw error;
    }
  }

  async createCliente(data) {
    try {
      logger.info('Criando novo cliente', { email: data.email });
      
      // Validar se email já existe
      const existingEmail = await ClienteRepository.findByEmail(data.email);
      if (existingEmail) {
        const error = new Error('Email já cadastrado');
        error.statusCode = 409;
        throw error;
      }
      
      // Validar se CPF já existe
      const existingCpf = await ClienteRepository.findByCpf(data.cpf);
      if (existingCpf) {
        const error = new Error('CPF já cadastrado');
        error.statusCode = 409;
        throw error;
      }
      
      const cliente = await ClienteRepository.create(data);
      logger.info('Cliente criado com sucesso', { id: cliente._id });
      
      return cliente;
    } catch (error) {
      logger.error('Erro ao criar cliente', { error: error.message });
      throw error;
    }
  }

  async updateCliente(id, data) {
    try {
      logger.info('Atualizando cliente', { id });
      
      // Verificar se existe
      await this.getClienteById(id);
      
      // Se está mudando email, verificar se já existe
      if (data.email) {
        const existingEmail = await ClienteRepository.findByEmail(data.email);
        if (existingEmail && existingEmail._id.toString() !== id) {
          const error = new Error('Email já cadastrado');
          error.statusCode = 409;
          throw error;
        }
      }
      
      const cliente = await ClienteRepository.update(id, data);
      logger.info('Cliente atualizado com sucesso', { id });
      
      return cliente;
    } catch (error) {
      logger.error('Erro ao atualizar cliente', { id, error: error.message });
      throw error;
    }
  }

  async deleteCliente(id) {
    try {
      logger.info('Deletando cliente', { id });
      
      // Verificar se existe
      await this.getClienteById(id);
      
      await ClienteRepository.delete(id);
      logger.info('Cliente deletado com sucesso', { id });
      
      return { message: 'Cliente deletado com sucesso' };
    } catch (error) {
      logger.error('Erro ao deletar cliente', { id, error: error.message });
      throw error;
    }
  }
}

module.exports = new ClienteService();