const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    price: { type: Number, required: true },
    seatNumber: { type: String, required: true },
    isVip: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);