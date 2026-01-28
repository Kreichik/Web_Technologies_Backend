const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/', protect, adminOnly, ticketController.createTicket);
router.put('/:id', protect, adminOnly, ticketController.updateTicket);
router.delete('/:id', protect, adminOnly, ticketController.deleteTicket);

module.exports = router;