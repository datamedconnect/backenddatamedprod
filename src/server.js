const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
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
const cookieParser = require("cookie-parser");
const path = require("path");
connectDB();

const app = express();
const PORT = 3000;
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://datamedconnect.com",
      "https://admin.datamedconnect.com",
      "http://localhost:3000",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
// Routes
// app.use("/api/integration", integrationRoutes);
app.use("/api/consultants", consultantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/email", emailRoutes);
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/super", superRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
