const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');

let app = express();

app.use(express.json());

app.use(express.static('public'));

var ticketSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, required: true },
    description: String,
}, { timestamps: true });

var Ticket = mongoose.model('Ticket', ticketSchema);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};


app.get('/tickets', async (request, response) => {
    const tickets = await Ticket.find();
    response.json(tickets);
})

app.get('/tickets/:id', async (request, response) => {
    try {
        const ticket = await Ticket.findById(request.params.id);
        
        if (!ticket) {
            return response.status(404).json({ error: "Ticket not found" });
        }
        
        response.json(ticket);
    } catch (error) {
        response.status(400).json({ error: "Invalid ID format" });
    }
});

app.post('/tickets', async (request, response) => {
    try {
        if (!request.body.name) {
            return response.status(400).json({ Error: "The name is required" });
        }

        const newTicket = await Ticket.create({
            name: request.body.name,
            price: request.body.price,
            date: request.body.date,
            description: request.body.description
        });

        response.status(201).json(newTicket);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

app.put('/tickets/:id', async (request, response) => {
    try {
        const updatedTicket = await Ticket.findByIdAndUpdate(
            request.params.id, 
            request.body, 
            { new: true } 
        );

        if (!updatedTicket) {
            return response.status(404).json({ error: "Ticket not found" });
        }

        response.json(updatedTicket);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

app.delete('/tickets/:id', async (request, response) => {
    try {
        const deletedTicket = await Ticket.findByIdAndDelete(request.params.id);

        if (!deletedTicket) {
            return response.status(404).json({ error: "Ticket not found" });
        }

        response.json({ success: true, message: "Ticket deleted" });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});


const startServer = async () => {
    await connectDB();

    app.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
})
}

startServer();