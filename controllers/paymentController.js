const Payment = require('../models/Payment');

exports.createPayment = async (req, res) => {
    try {
        const { amount, eventId, seatNumber } = req.body;
        const payment = await Payment.create({
            amount,
            eventId,
            seatNumber,
            userId: req.user.userId
        });
        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ error: 'Payment not found' });
        res.json({ status: payment.status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.confirmPayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });
        if (!payment) return res.status(404).json({ error: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
