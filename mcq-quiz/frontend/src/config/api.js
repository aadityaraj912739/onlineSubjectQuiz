// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

// For production deployment, create a .env.production file with:
// REACT_APP_API_URL=https://onlinesubjectquiz.onrender.com/api
// REACT_APP_BACKEND_URL=https://onlinesubjectquiz.onrender.com

// Axios timeout configuration (5 seconds)
export const API_TIMEOUT = 5000;
