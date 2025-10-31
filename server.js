const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const url = process.env.MONGODB_URI;

console.log('Connecting to MongoDB...');
console.log('MongoDB URI:', url ? 'Found' : 'Not found');

const client = new MongoClient(url);

// Connect to MongoDB with proper error handling
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('Server will continue running but database operations will fail');
    }
}

connectToMongoDB();

const app = express();

// Enhanced CORS configuration
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Additional CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

var api = require('./api.js');
api.setApp( app, client );

const PORT = 5001;

// Add a test route to verify the server is working
app.get('/api/test', (req, res) => {
    console.log('✅ Test endpoint called');
    res.json({ message: 'Backend server is working!', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`🔗 Direct connection enabled`);
    
    // Test that the server is actually listening
    const http = require('http');
    const testReq = http.get(`http://localhost:${PORT}/api/test`, (res) => {
        console.log('✅ Server self-test successful:', res.statusCode);
    });
    testReq.on('error', (err) => {
        console.error('❌ Server self-test failed:', err.message);
    });
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});