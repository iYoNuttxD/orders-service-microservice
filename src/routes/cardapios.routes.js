const express = require('express');
const { body, param } = require('express-validator');
const CardapioController = require('../controllers/CardapioController');
const validate = require('../middlewares/validator');

const router = express.Router();

const createValidation = [
  body('restauranteId').isMongoId().withMessage('ID do restaurante inválido'),
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
  body('preco').isFloat({ min: 0 }).withMessage('Preço deve ser maior ou igual a 0'),
  body('categoria').isIn([
    'ENTRADA', 'PRATO_PRINCIPAL', 'SOBREMESA', 'BEBIDA', 'LANCHE', 'OUTROS'
  ]).withMessage('Categoria inválida'),
  validate
];

const updateValidation = [
  body('nome').optional().notEmpty(),
  body('descricao').optional().notEmpty(),
  body('preco').optional().isFloat({ min: 0 }),
  body('categoria').optional().isIn([
    'ENTRADA', 'PRATO_PRINCIPAL', 'SOBREMESA', 'BEBIDA', 'LANCHE', 'OUTROS'
  ]),
  body('disponivel').optional().isBoolean(),
  validate
];

const idValidation = [
  param('id').isMongoId().withMessage('ID inválido'),
  validate
];

const restauranteIdValidation = [
  param('restauranteId').isMongoId().withMessage('ID do restaurante inválido'),
  validate
];

router.get('/', CardapioController.getAll);
router.get('/restaurante/:restauranteId', restauranteIdValidation, CardapioController.getByRestaurante);
router.get('/:id', idValidation, CardapioController.getById);
router.post('/', createValidation, CardapioController.create);
router.put('/:id', [...idValidation, ...updateValidation], CardapioController.update);
router.patch('/:id/disponibilidade', idValidation, CardapioController.toggleDisponibilidade);
router.delete('/:id', idValidation, CardapioController.delete);

module.exports = router;