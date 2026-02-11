const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, ticketController.getAllTickets);
router.get('/occupied/:eventId', protect, ticketController.getOccupiedSeats); 
router.get('/:id', protect, ticketController.getTicketById);
router.post('/', protect, ticketController.createTicket);
router.put('/:id', protect, adminOnly, ticketController.updateTicket);
router.delete('/:id', protect, adminOnly, ticketController.deleteTicket);

module.exports = router;