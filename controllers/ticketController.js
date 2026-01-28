const Ticket = require('../models/Ticket');

exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find();
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        
        res.json(ticket);
    } catch (error) {
        res.status(400).json({ error: "Invalid ID format" });
    }
};

exports.createTicket = async (req, res) => {
    try {
        if (!req.body.price || !req.body.eventId) {
            return res.status(400).json({ error: "Price and Event ID are required" });
        }

        const newTicket = await Ticket.create(req.body);
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTicket = async (req, res) => {
    try {
        const updated = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (!updated) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const deleted = await Ticket.findByIdAndDelete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        res.json({ message: 'Ticket deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};