require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const foodRoutes = require('./routes/foodRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRouter = require('./routes/userRoute');
const favoriteRouter = require('./routes/favoriteRouter');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// ========== CORS FIX ==========
const cors = require('cors');

// Allow all origins for now (simplest solution)
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// Handle preflight requests
app.options('/*', cors());
// ========== END CORS FIX ==========

// Middleware
app.use(express.json());

// Routes
app.use('/api/foods', foodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/reviews', reviewRoutes);

// Test endpoint to verify CORS
app.get('/api/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    allowedOrigin: req.headers.origin || 'unknown'
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Food Ordering API',
    status: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cors: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// API status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState,
    uptime: process.uptime(),
    cors: 'enabled',
    origin: req.headers.origin || 'not provided'
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env file');
  process.exit(1);
}

// MongoDB Connection with retry logic
const connectWithRetry = async () => {
  console.log('🔗 Attempting MongoDB Atlas connection...');
  console.log('📡 Connection string:', MONGO_URI.replace(/:[^:]*@/, ':****@'));
  
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Atlas Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔧 CORS: Enabled for all origins`);
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Public URL: https://food-delivery-api-z25o.onrender.com`);
      console.log(`🔗 Health check: https://food-delivery-api-z25o.onrender.com/api/health`);
      console.log(`🧪 CORS test: https://food-delivery-api-z25o.onrender.com/api/test-cors`);
    });
    
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Start the connection
connectWithRetry();

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed through app termination');
  process.exit(0);
});