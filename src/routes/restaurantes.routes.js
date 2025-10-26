const express = require('express');
const { body, param } = require('express-validator');
const RestauranteController = require('../controllers/RestauranteController');
const validate = require('../middlewares/validator');

const router = express.Router();

const createValidation = [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('cnpj').isLength({ min: 14, max: 14 }).withMessage('CNPJ deve ter 14 dígitos'),
  body('email').isEmail().withMessage('Email inválido'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
  body('categoria').isIn([
    'BRASILEIRA', 'ITALIANA', 'JAPONESA', 'LANCHES', 'PIZZARIA', 'SOBREMESAS', 'OUTROS'
  ]).withMessage('Categoria inválida'),
  body('horarioFuncionamento.abertura').notEmpty().withMessage('Horário de abertura é obrigatório'),
  body('horarioFuncionamento.fechamento').notEmpty().withMessage('Horário de fechamento é obrigatório'),
  validate
];

const updateValidation = [
  body('nome').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('status').optional().isIn(['ATIVO', 'INATIVO', 'FECHADO']),
  validate
];

const idValidation = [
  param('id').isMongoId().withMessage('ID inválido'),
  validate
];

router.get('/', RestauranteController.getAll);
router.get('/:id', idValidation, RestauranteController.getById);
router.get('/categoria/:categoria', RestauranteController.getByCategoria);
router.post('/', createValidation, RestauranteController.create);
router.put('/:id', [...idValidation, ...updateValidation], RestauranteController.update);
router.delete('/:id', idValidation, RestauranteController.delete);

module.exports = router;