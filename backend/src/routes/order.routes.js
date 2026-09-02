'use strict';

const express = require('express');
const orderController = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createOrderSchema, listOrderQuerySchema } = require('../validators/order.validator');

const router = express.Router();

// All customer order endpoints require authentication
router.use(protect);

/** POST /api/orders — checkout & place order */
router.post('/', validate(createOrderSchema), orderController.createOrder);

/** GET /api/orders — customer's paginated orders */
router.get('/', validate(listOrderQuerySchema, 'query'), orderController.getMyOrders);

/** GET /api/orders/:id — single order details */
router.get('/:id', orderController.getMyOrderById);

module.exports = router;
