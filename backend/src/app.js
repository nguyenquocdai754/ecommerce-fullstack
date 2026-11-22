const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// Chỉ gắn authRoutes để test đăng nhập/đăng ký trước
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "E-commerce API is running" });
});

module.exports = app;
