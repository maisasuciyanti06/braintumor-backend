require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('../routes/authRoutes');
const patientRoutes = require('../routes/patientRoutes');

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware CORS
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
}));

// Middleware untuk parsing JSON
app.use(express.json());

// Middleware Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        status: 'fail',
        message: 'Too many requests, please try again later.',
    },
});
app.use(limiter);

// Gunakan rute autentikasi dan pasien
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);

// Middleware untuk rute yang tidak ditemukan
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: 'Route not found',
    });
});


// Graceful shutdown
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing server gracefully.');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing server gracefully.');
    process.exit(0);
});

// Jalankan server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di http://0.0.0.0:${PORT}`);
});
