const mongoose = require('mongoose');
require('dotenv').config();

const Cliente = require('../src/models/Cliente');
const Restaurante = require('../src/models/Restaurante');
const Cardapio = require('../src/models/Cardapio');

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Limpar dados existentes
    await Cliente.deleteMany({});
    await Restaurante.deleteMany({});
    await Cardapio.deleteMany({});
    
    console.log('🗑️  Dados antigos removidos\n');
    
    // Criar Clientes
    const clientes = await Cliente.insertMany([
      {
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '11987654321',
        cpf: '12345678901',
        endereco: {
          rua: 'Rua das Flores',
          numero: '100',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01000000'
        }
      },
      {
        nome: 'Maria Santos',
        email: 'maria@example.com',
        telefone: '11876543210',
        cpf: '98765432109',
        endereco: {
          rua: 'Av. Paulista',
          numero: '1000',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01310000'
        }
      }
    ]);
    
    console.log(`✅ ${clientes.length} clientes criados`);
    
    // Criar Restaurantes
    const restaurantes = await Restaurante.insertMany([
      {
        nome: 'Pizzaria Bella Napoli',
        cnpj: '12345678000190',
        email: 'contato@bellanapoli.com',
        telefone: '1133334444',
        categoria: 'PIZZARIA',
        horarioFuncionamento: {
          abertura: '18:00',
          fechamento: '23:00'
        },
        endereco: {
          rua: 'Rua Augusta',
          numero: '500',
          bairro: 'Consolação',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01305000'
        }
      },
      {
        nome: 'Hamburgueria Top Burger',
        cnpj: '98765432000100',
        email: 'contato@topburger.com',
        telefone: '1144445555',
        categoria: 'LANCHES',
        horarioFuncionamento: {
          abertura: '11:00',
          fechamento: '22:00'
        },
        endereco: {
          rua: 'Rua Oscar Freire',
          numero: '300',
          bairro: 'Jardins',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01426000'
        }
      }
    ]);
    
    console.log(`✅ ${restaurantes.length} restaurantes criados`);
    
    // Criar Cardápios
    const cardapios = await Cardapio.insertMany([
      // Pizzaria
      {
        restauranteId: restaurantes[0]._id,
        nome: 'Pizza Margherita',
        descricao: 'Molho de tomate, mussarela, manjericão e azeite',
        preco: 45.90,
        categoria: 'PRATO_PRINCIPAL',
        disponivel: true
      },
      {
        restauranteId: restaurantes[0]._id,
        nome: 'Pizza Calabresa',
        descricao: 'Molho de tomate, mussarela, calabresa e cebola',
        preco: 49.90,
        categoria: 'PRATO_PRINCIPAL',
        disponivel: true
      },
      {
        restauranteId: restaurantes[0]._id,
        nome: 'Refrigerante Lata',
        descricao: 'Coca-Cola, Guaraná ou Fanta',
        preco: 5.00,
        categoria: 'BEBIDA',
        disponivel: true
      },
      // Hamburgueria
      {
        restauranteId: restaurantes[1]._id,
        nome: 'X-Burger Clássico',
        descricao: 'Hambúrguer, queijo, alface, tomate e molho especial',
        preco: 28.90,
        categoria: 'LANCHE',
        disponivel: true
      },
      {
        restauranteId: restaurantes[1]._id,
        nome: 'X-Bacon',
        descricao: 'Hambúrguer, queijo, bacon, alface, tomate',
        preco: 32.90,
        categoria: 'LANCHE',
        disponivel: true
      },
      {
        restauranteId: restaurantes[1]._id,
        nome: 'Batata Frita Grande',
        descricao: 'Porção grande de batata frita crocante',
        preco: 15.00,
        categoria: 'ENTRADA',
        disponivel: true
      }
    ]);
    
    console.log(`✅ ${cardapios.length} itens do cardápio criados`);
    
    console.log('\n✅ Seed concluído com sucesso!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro no seed:', error);
    process.exit(1);
  }
}

seed();