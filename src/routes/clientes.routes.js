const express = require('express');
const { body, param } = require('express-validator');
const ClienteController = require('../controllers/ClienteController');
const validate = require('../middlewares/validator');

const router = express.Router();

// Validações
const createValidation = [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
  body('cpf').isLength({ min: 11, max: 11 }).withMessage('CPF deve ter 11 dígitos'),
  body('endereco.rua').notEmpty().withMessage('Rua é obrigatória'),
  body('endereco.numero').notEmpty().withMessage('Número é obrigatório'),
  body('endereco.bairro').notEmpty().withMessage('Bairro é obrigatório'),
  body('endereco.cidade').notEmpty().withMessage('Cidade é obrigatória'),
  body('endereco.estado').notEmpty().withMessage('Estado é obrigatório'),
  body('endereco.cep').notEmpty().withMessage('CEP é obrigatório'),
  validate
];

const updateValidation = [
  body('nome').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('telefone').optional().notEmpty(),
  body('status').optional().isIn(['ATIVO', 'INATIVO', 'BLOQUEADO']),
  validate
];

const idValidation = [
  param('id').isMongoId().withMessage('ID inválido'),
  validate
];

// Rotas
router.get('/', ClienteController.getAll);
router.get('/:id', idValidation, ClienteController.getById);
router.post('/', createValidation, ClienteController.create);
router.put('/:id', [...idValidation, ...updateValidation], ClienteController.update);
router.delete('/:id', idValidation, ClienteController.delete);

module.exports = router;