import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import emissionRoutes from './routes/emissions.js';
import analyticsRoutes from './routes/analytics.js';

// Middleware imports
import globalErrorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json({ limit: '10kb' }));

// CORS - Updated for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Compression
app.use(compression());

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running healthy!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/emissions', emissionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// Database connection for MongoDB Atlas
const connectDB = async () => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    // Validate the connection string format
    if (!process.env.MONGODB_URI.startsWith('mongodb+srv://') && 
        !process.env.MONGODB_URI.startsWith('mongodb://')) {
      throw new Error('Invalid MONGODB_URI format. Must start with mongodb+srv:// or mongodb://');
    }

    console.log('🔗 Attempting to connect to MongoDB Atlas...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // More specific error messages
    if (error.message.includes('MONGODB_URI is not defined')) {
      console.error('💡 Solution: Add MONGODB_URI to your .env file');
    } else if (error.message.includes('Invalid MONGODB_URI format')) {
      console.error('💡 Solution: Your connection string should start with mongodb+srv://');
      console.error('   Example: mongodb+srv://username:password@cluster.mongodb.net/database');
    } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('💡 Solution: Check your username and password in the connection string');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('💡 Solution: Check your cluster URL in the connection string');
    }
    
    process.exit(1);
  }
};

// Connect to database
connectDB();
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

export default app;