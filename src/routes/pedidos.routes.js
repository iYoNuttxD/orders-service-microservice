const express = require('express');
const { body, param } = require('express-validator');
const PedidoController = require('../controllers/PedidoController');
const validate = require('../middlewares/validator');

const router = express.Router();

const createValidation = [
  body('clienteId').isMongoId().withMessage('ID do cliente inválido'),
  body('restauranteId').isMongoId().withMessage('ID do restaurante inválido'),
  body('items').isArray({ min: 1 }).withMessage('Pedido deve ter pelo menos 1 item'),
  body('items.*.cardapioId').isMongoId().withMessage('ID do cardápio inválido'),
  body('items.*.quantidade').isInt({ min: 1 }).withMessage('Quantidade deve ser pelo menos 1'),
  validate
];

const statusValidation = [
  body('status').isIn([
    'PENDENTE', 'CONFIRMADO', 'PREPARANDO', 'PRONTO', 'EM_ENTREGA', 'ENTREGUE', 'CANCELADO'
  ]).withMessage('Status inválido'),
  validate
];

const idValidation = [
  param('id').isMongoId().withMessage('ID inválido'),
  validate
];

router.get('/', PedidoController.getAll);
router.get('/dashboard', PedidoController.getDashboard);
router.get('/:id', idValidation, PedidoController.getById);
router.post('/', createValidation, PedidoController.create);
router.patch('/:id/status', [...idValidation, ...statusValidation], PedidoController.updateStatus);
router.patch('/:id/cancelar', idValidation, PedidoController.cancel);

module.exports = router;