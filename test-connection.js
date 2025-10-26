const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com MongoDB Atlas...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Banco de dados:', mongoose.connection.name);
    console.log('📍 Host:', mongoose.connection.host);
    
    // Listar coleções
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length > 0) {
      console.log('\n📋 Coleções existentes:');
      collections.forEach(col => {
        console.log(`   ✓ ${col.name}`);
      });
    } else {
      console.log('\n📋 Nenhuma coleção criada ainda');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro na conexão:', error.message);
    process.exit(1);
  }
}

testConnection();