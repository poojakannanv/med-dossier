const mongoose = require('mongoose');

const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in the environment');
  }
  const conn = await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
