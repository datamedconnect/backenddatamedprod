require("./config/instruments");
require('dotenv').config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const connectDB = require("./database/connection");
const consultantRoutes = require("./routes/consultantRoutes");
const profileRoutes = require("./routes/profileRoutes");
const otpRoutes = require("./routes/optRoutes");
const emailRoutes = require("./routes/emailRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const clientRoutes = require("./routes/clientRoutes");
const slotRoutes = require("./routes/slotRoutes");
const superRoutes = require("./routes/superRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const downloadRoutes = require("./routes/downloadRoutes");
const cookieParser = require("cookie-parser");
const path = require("path");
const loggingMiddleware = require("./middleware/loggingMiddleware");
const Sentry = require("@sentry/node");

connectDB();

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const io = socketIo(server, { cors: corsOptions });

const PORT = 3000;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public")); // Serve static files from 'public' folder
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(loggingMiddleware);
app.use(express.json());

// Routes
app.use("/api/consultants", consultantRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/email", emailRoutes);
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/super", superRoutes);
app.use("/api/notifications", notificationRoutes);
// app.get("/debug-sentry", function mainHandler(req, res) {
//   throw new Error("My first Sentry error!");
// });
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Setup Sentry Express error handler after all routes
Sentry.setupExpressErrorHandler(app);

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
});

app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});