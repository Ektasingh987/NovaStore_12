'use strict';

const express      = require('express');
const cartController = require('../controllers/cart.controller');
const { protect }  = require('../middlewares/auth.middleware');
const validate     = require('../middlewares/validation.middleware');
const { addItemSchema, updateItemSchema } = require('../validators/cart.validator');

const router = express.Router();

// All cart routes require a valid access token
router.use(protect);

/** GET /api/cart */
router.get('/', cartController.getCart);

/** DELETE /api/cart — clear entire cart */
router.delete('/', cartController.clearCart);

/** POST /api/cart/items — add or update an item */
router.post('/items', validate(addItemSchema), cartController.addItem);

/** PATCH /api/cart/items/:productId — set quantity */
router.patch('/items/:productId', validate(updateItemSchema), cartController.updateItem);

/** DELETE /api/cart/items/:productId — remove one item */
router.delete('/items/:productId', cartController.removeItem);

module.exports = router;
