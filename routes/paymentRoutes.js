const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, paymentController.createPayment);
router.get('/:id/status', paymentController.getPaymentStatus);
router.post('/:id/confirm', paymentController.confirmPayment);

module.exports = router;