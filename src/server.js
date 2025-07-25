require("./config/instruments");
require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet"); // Added for secure headers
const rateLimit = require("express-rate-limit"); // Added for rate limiting
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
app.use(helmet()); // Added: Secure headers (e.g., CSP, XSS protection)

const server = http.createServer(app);

const corsOptions = {
  origin: [
    "https://datamedconnect.com",
    "https://admin.datamedconnect.com",
    "https://datamedconnect-1037995697399.europe-west1.run.app",
    "https://datamedconnectadmin-1037995697399.europe-west1.run.app",
    // Add "http://localhost:3000" for local development if needed
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204, // Ensure preflight requests return 204
};
const io = socketIo(server, { cors: corsOptions });

// // Rate limiting middleware (added)
// const limiter = rateLimit({
//   windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
//   max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per window
//   message: "Too many requests from this IP, please try again later.",
// });
// app.use(limiter); // Apply to all routes (or specific ones if preferred)

const PORT = process.env.PORT || 3000;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public")); // Serve static files from 'public' folder
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(loggingMiddleware);
app.use(express.json());

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});
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
