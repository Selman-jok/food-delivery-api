// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// // const objectiveRoutes = require('./routes/objectiveRoutes');
// const foodRoutes = require('./routes/foodRoutes');
// const cartRoutes = require('./routes/cartRoutes');
// const userRouter=require('./routes/userRoute');
// const favoriteRouter = require('./routes/favoriteRouter');
// const reviewRoutes = require('./routes/reviewRoutes');
// // const path = require('path');
// // const fs = require('fs');
// const app = express();
// app.use(express.json());

// // CORS for your mobile app (simple)
// const cors = require('cors');
// app.use(cors());


// // routes
// app.use('/api/foods', foodRoutes);
// app.use('/api/cart', cartRoutes);
// app.use('/api/users',userRouter);
// app.use('/api/favorites', favoriteRouter);
// app.use('/api/reviews', reviewRoutes);

// // Basic route
// app.get('/', (req, res) => {
//     res.json({ message: 'Food Ordering API' });
// });

// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI;

// if (!MONGO_URI) {
//   console.error('MONGO_URI missing in .env');
//   process.exit(1);
// }

// mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log('Mongo connected');
//     app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
//   })
//   .catch(err => {
//     console.error('Failed to connect to Mongo', err);
//     process.exit(1);
//   });
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const foodRoutes = require('./routes/foodRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRouter = require('./routes/userRoute');
const favoriteRouter = require('./routes/favoriteRouter');
const reviewRoutes = require('./routes/reviewRoutes');
const app = express();

// Middleware
app.use(express.json());

// CORS - allow mobile app and web
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:8081', '*'], // Add your Flutter web/Android IPs
  credentials: true
}));

// Routes
app.use('/api/foods', foodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Food Ordering API',
    status: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState,
    uptime: process.uptime()
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
  console.log('📡 Connection string:', MONGO_URI.replace(/:[^:]*@/, ':****@')); // Hide password in logs
  
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
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API URL: http://localhost:${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
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