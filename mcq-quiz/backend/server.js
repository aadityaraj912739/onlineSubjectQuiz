require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const detect = require('detect-port').default;

// Check for JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://online-subject-quiz.vercel.app'
    ],
    credentials: true
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mcqquiz', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

// Connect to database
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/results', require('./routes/results'));
app.use('/api/study-materials', require('./routes/studyMaterials'));
app.use('/api/previous-papers', require('./routes/previousPapers'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'McqQuiz API is running!' });
});

const PORT = process.env.PORT || 5001;

const startServer = (port) => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

detect(PORT, (err, _port) => {
    if (err) {
        console.log('Error detecting port:', err);
        // Fallback to default port if detection fails
        startServer(PORT);
        return;
    }

    if (PORT !== _port) {
        console.log(`Port ${PORT} was occupied, using port ${_port} instead.`);
        startServer(_port);
    } else {
        startServer(PORT);
    }
});