const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillbridge';

let mongoConnectionError = null;
let mongoConnectionPromise = null;

const connectMongo = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000
    })
      .then(() => {
        mongoConnectionError = null;
        console.log("MongoDB Connected Successfully!");
        return mongoose.connection;
      })
      .catch(err => {
        mongoConnectionPromise = null;
        mongoConnectionError = err;
        console.error("MongoDB Connection Error:", err);
        throw err;
      });
  }

  return mongoConnectionPromise;
};

const getMongoError = () => mongoConnectionError;

module.exports = {
  connectMongo,
  getMongoError,
  MONGO_URI
};

