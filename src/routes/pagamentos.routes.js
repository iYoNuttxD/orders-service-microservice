const express = require('express');
const { body, param } = require('express-validator');
const PagamentoController = require('../controllers/PagamentoController');
const validate = require('../middlewares/validator');

const router = express.Router();

const createValidation = [
  body('pedidoId').isMongoId().withMessage('ID do pedido inválido'),
  body('valor').isFloat({ min: 0 }).withMessage('Valor deve ser maior ou igual a 0'),
  body('metodo').isIn([
    'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'VALE_REFEICAO'
  ]).withMessage('Método de pagamento inválido'),
  validate
];

const statusValidation = [
  body('status').isIn([
    'PENDENTE', 'PROCESSANDO', 'APROVADO', 'RECUSADO', 'CANCELADO'
  ]).withMessage('Status inválido'),
  validate
];

const idValidation = [
  param('id').isMongoId().withMessage('ID inválido'),
  validate
];

const pedidoIdValidation = [
  param('pedidoId').isMongoId().withMessage('ID do pedido inválido'),
  validate
];

router.get('/', PagamentoController.getAll);
router.get('/pedido/:pedidoId', pedidoIdValidation, PagamentoController.getByPedido);
router.get('/:id', idValidation, PagamentoController.getById);
router.post('/', createValidation, PagamentoController.create);
router.patch('/:id/status', [...idValidation, ...statusValidation], PagamentoController.updateStatus);
router.patch('/:id/processar', idValidation, PagamentoController.processar);
router.patch('/:id/cancelar', idValidation, PagamentoController.cancelar);

module.exports = router;