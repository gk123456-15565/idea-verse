const mongoose = require('mongoose');

let isConnectedToMongo = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri === 'your_mongodb_connection_string' || uri.trim() === '') {
    console.log('ℹ️ [IDEAVERSE] No MONGODB_URI configured. Running with resilient local data store.');
    isConnectedToMongo = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
    });
    isConnectedToMongo = true;
    console.log(`✅ [IDEAVERSE] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`⚠️ [IDEAVERSE] MongoDB Connection failed: ${error.message}`);
    isConnectedToMongo = false;
    return false;
  }
};

module.exports = {
  connectDB,
  isConnectedToMongo: () => isConnectedToMongo
};
