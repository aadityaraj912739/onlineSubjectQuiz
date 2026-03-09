require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const detect = require('detect-port').default;
const session = require('express-session');
const passport = require('./config/passport');

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

// Session middleware (required for passport)
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

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
        console.error('Server will continue but database operations will fail.');
        console.error('Please whitelist your IP in MongoDB Atlas Network Access settings.');
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
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/forums', require('./routes/forums'));
app.use('/api/study-groups', require('./routes/studyGroups'));
app.use('/api/doubts', require('./routes/doubts'));
app.use('/api/helpdesk', require('./routes/helpdesk'));
app.use('/api/contact', require('./routes/contact'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'McqQuiz API is running!' });
});

const PORT = parseInt(process.env.PORT) || 5001;

const startServer = (port) => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use, trying another port...`);
            setTimeout(() => {
                startServer(port + 1);
            }, 1000);
        } else {
            console.error('Server error:', err);
        }
    });
};

startServer(PORT);