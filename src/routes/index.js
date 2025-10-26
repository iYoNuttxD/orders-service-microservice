const express = require('express');
const clientesRoutes = require('./clientes.routes');
const restaurantesRoutes = require('./restaurantes.routes');
const cardapiosRoutes = require('./cardapios.routes');
const pedidosRoutes = require('./pedidos.routes');
const avaliacoesRoutes = require('./avaliacoes.routes');
const pagamentosRoutes = require('./pagamentos.routes');

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Orders Service',
    version: '1.0.0',
    database: 'MongoDB Atlas'
  });
});

// Rotas principais
router.use('/clientes', clientesRoutes);
router.use('/restaurantes', restaurantesRoutes);
router.use('/cardapios', cardapiosRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/avaliacoes', avaliacoesRoutes);
router.use('/pagamentos', pagamentosRoutes);

module.exports = router;