const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

exports.getAllTickets = async (req, res) => {
    try {
        let tickets;
        if (req.user.role === 'admin') {
            tickets = await Ticket.find();
        } else {
            tickets = await Ticket.find({ userId: req.user.userId });
        }

        const ticketsWithEvents = await Promise.all(tickets.map(async (ticket) => {
            const event = await Event.findById(ticket.eventId);
            let ticketObj = ticket.toObject();
            ticketObj.eventId = event ? event : { title: 'Unknown Event', date: null };
            return ticketObj;
        }));

        res.json(ticketsWithEvents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ error: "Ticket not found" });

        if (req.user.role !== 'admin' && ticket.userId !== req.user.userId) {
            return res.status(403).json({ error: "Access denied" });
        }
        
        const event = await Event.findById(ticket.eventId);
        let ticketObj = ticket.toObject();
        ticketObj.eventId = event ? event : { title: 'Unknown Event', date: null };
        
        res.json(ticketObj);
    } catch (error) {
        res.status(400).json({ error: "Invalid ID format" });
    }
};

exports.getOccupiedSeats = async (req, res) => {
    try {
        const { eventId } = req.params;
        const tickets = await Ticket.find({ eventId }).select('seatNumber');
        const occupied = tickets.map(t => t.seatNumber);
        res.json(occupied);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTicket = async (req, res) => {
    try {
        const { eventId, seatNumber, price, isVip } = req.body;

        if (!eventId || !seatNumber || !price) {
            return res.status(400).json({ error: "Event ID, Seat Number and Price are required" });
        }

        const eventExists = await Event.findById(eventId);
        if (!eventExists) return res.status(404).json({ error: "Event not found" });

        const seatTaken = await Ticket.findOne({ eventId, seatNumber });
        if (seatTaken) return res.status(400).json({ error: "Seat is already taken" });

        const newTicket = await Ticket.create({
            eventId,
            userId: req.user.userId,
            seatNumber,
            price,
            isVip
        });

        res.status(201).json(newTicket);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTicket = async (req, res) => {
    try {
        const updated = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Ticket not found" });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const deleted = await Ticket.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Ticket not found" });
        res.json({ message: 'Ticket deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};