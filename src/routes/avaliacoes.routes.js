const express = require('express');
const { body, param } = require('express-validator');
const AvaliacaoController = require('../controllers/AvaliacaoController');
const validate = require('../middlewares/validator');

const router = express.Router();

const createValidation = [
  body('pedidoId').isMongoId().withMessage('ID do pedido inválido'),
  body('clienteId').isMongoId().withMessage('ID do cliente inválido'),
  body('restauranteId').isMongoId().withMessage('ID do restaurante inválido'),
  body('nota').isInt({ min: 1, max: 5 }).withMessage('Nota deve ser entre 1 e 5'),
  body('comentario').optional().isLength({ max: 500 }).withMessage('Comentário não pode ter mais de 500 caracteres'),
  validate
];

const updateValidation = [
  body('nota').optional().isInt({ min: 1, max: 5 }),
  body('comentario').optional().isLength({ max: 500 }),
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

router.get('/', AvaliacaoController.getAll);
router.get('/restaurante/:restauranteId/media', restauranteIdValidation, AvaliacaoController.getMediaRestaurante);
router.get('/:id', idValidation, AvaliacaoController.getById);
router.post('/', createValidation, AvaliacaoController.create);
router.put('/:id', [...idValidation, ...updateValidation], AvaliacaoController.update);
router.delete('/:id', idValidation, AvaliacaoController.delete);

module.exports = router;