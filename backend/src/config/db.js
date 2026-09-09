const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: true
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
