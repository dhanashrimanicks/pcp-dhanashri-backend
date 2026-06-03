const app = require("../src/app");
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw err;
  }
};

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
