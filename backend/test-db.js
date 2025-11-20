import mongoose from 'mongoose';
import 'dotenv/config';

async function testDB() {
  try {
    console.log('🔗 Testing MongoDB Atlas connection...');
    
    // Mask password in log
    const maskedURI = process.env.MONGODB_URI.replace(/:([^:]+)@/, ':****@');
    console.log('Connection string:', maskedURI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas connected successfully!');
    
    // Test basic operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('✅ Test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Check your username and password in the connection string');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('💡 Check your cluster URL in the connection string');
    } else if (error.message.includes('bad auth')) {
      console.log('💡 Check your database username and password');
    }
    
    process.exit(1);
  }
}

testDB();