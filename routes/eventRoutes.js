const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', protect, adminOnly, eventController.createEvent);
router.put('/:id', protect, adminOnly, eventController.updateEvent);
router.delete('/:id', protect, adminOnly, eventController.deleteEvent);

module.exports = router;