const Event = require('../models/Event');

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        
        res.json(event);
    } catch (error) {
        res.status(400).json({ error: "Invalid ID format" });
    }
};

exports.createEvent = async (req, res) => {
    try {
        if (!req.body.title || !req.body.date || !req.body.location) {
            return res.status(400).json({ error: "Title, Date, and Location are required" });
        }

        const newEvent = await Event.create(req.body);
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (!updated) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const deleted = await Event.findByIdAndDelete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};