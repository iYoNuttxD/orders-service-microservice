const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Swagger Documentation
const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Orders Service API Docs',
  customfavIcon: '/favicon.ico',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Rotas
app.use('/api/v1', routes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Orders Service API',
    version: '1.0.0',
    database: 'MongoDB Atlas',
    endpoints: {
      health: '/api/v1/health',
      clientes: '/api/v1/clientes',
      restaurantes: '/api/v1/restaurantes',
      cardapios: '/api/v1/cardapios',
      pedidos: '/api/v1/pedidos',
      avaliacoes: '/api/v1/avaliacoes',
      pagamentos: '/api/v1/pagamentos'
    }
  });
});

// Middleware de erro (deve ser o último)
app.use(errorHandler);

// Exportar app SEM iniciar o servidor
module.exports = app;

// Só iniciar servidor se não for em modo de teste
if (require.main === module) {
  const connectDB = require('./config/database');
  const PORT = process.env.PORT || 3002;

  const startServer = async () => {
    try {
      // Conectar ao banco
      await connectDB();
      
      // Iniciar servidor
      const server = app.listen(PORT, () => {
        console.log(`🚀 Orders Service rodando na porta ${PORT}`);
        console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📊 MongoDB conectado`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('⚠️  SIGTERM recebido, fechando servidor...');
        server.close(() => {
          console.log('✅ Servidor encerrado');
          process.exit(0);
        });
      });
    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  };

  startServer();
}