require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const DB_NAME = process.env.MONGO_DB_NAME;

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Connected to MongoDB: ${DB_NAME}`);

    app.listen(PORT, () => {
      console.log(`🚀 Express server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

connect();

const masHistoryRoutes = require("./routes/masHistoryRoutes");
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
app.use("/api/mas-history", masHistoryRoutes);
