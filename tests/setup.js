const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Antes de todos os testes
beforeAll(async () => {
  try {
    // Fechar conexões existentes
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Criar servidor MongoDB em memória
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Conectar ao MongoDB em memória
    await mongoose.connect(mongoUri);

    console.log('🧪 MongoDB em memória conectado para testes');
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB para testes:', error);
    throw error;
  }
}, 60000); // Timeout de 60 segundos

// Após cada teste
afterEach(async () => {
  // Limpar todas as coleções
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Após todos os testes
afterAll(async () => {
  try {
    // Desconectar
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Parar servidor MongoDB em memória
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('🧪 MongoDB em memória desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
  }
}, 60000);

// Configurações globais
global.console = {
  ...console,
  // Desabilitar logs durante os testes
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Manter errors
  error: console.error,
};