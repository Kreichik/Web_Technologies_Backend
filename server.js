const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/tickets', ticketRoutes);

const startServer = async () => {
    await connectDB();
    app.listen(3000, () => {
        console.log("Server started at http://localhost:3000");
    });
};

startServer();