process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../server.js');
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  next();
});

async function startServer() {
  const url = process.env.MONGODB_URI;
  const client = new MongoClient(url);
  await client.connect();

  const api = require('./api.js');
  api.setApp(app, client);

  app.listen(5000, () => console.log('Server running on port 5000'));
}

// Only start automatically if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
