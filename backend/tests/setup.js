
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  // Skip MongoDB setup if already connected (for tests that don't need DB)
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  try {
    // Start MongoDB Memory Server with options for faster startup
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'test_db',
      },
      binary: {
        version: '6.0.8', // Use an older, faster version for testing
      }
    });
    
    const mongoUri = mongoServer.getUri();
    
    // Connect Mongoose to in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Memory Server for testing');
  } catch (error) {
    console.error('❌ MongoDB Memory Server connection error:', error);
    throw error;
  }
}, 60000); // Increase timeout to 60s for MongoDB download

afterAll(async () => {
  // Clean up and close connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
    console.log('✅ MongoDB Memory Server stopped');
  }
}, 30000);

afterEach(async () => {
  // Clean all collections after each test
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      try {
        await collection.deleteMany();
      } catch (error) {
        console.log(`Error cleaning collection ${key}:`, error.message);
      }
    }
  }
});