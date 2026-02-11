const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    amount: { type: Number, required: true },
    eventId: { type: String, required: true },
    seatNumber: { type: String, required: true },
    userId: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);