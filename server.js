const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(express.json());

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
app.use('/users', userRoutes);
app.use('/payments', paymentRoutes);

app.use((req, res, next) => {
    const host = req.headers.host || '';

    if (host.includes('kaspi')) {
        if (req.path === '/' || req.path === '/index.html') {
            return res.sendFile(path.join(__dirname, 'public', 'kaspi-pay.html'));
        }
    }
    
    next();
});

app.use(express.static('public'));

const startServer = async () => {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
};

startServer();