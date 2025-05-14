const otpService = require("../services/optService");

const sendOTP = async (req, res) => {
  try {
    const email = req.body.email?.trim() || "";
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    await otpService.sendOTP(email);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(`Error sending OTP: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const email = req.body.email?.trim() || "";
    const otp = req.body.otp?.trim() || "";
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    // Assuming OTP is a 6-digit number
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be a 6-digit number" });
    }
    const isValid = await otpService.verifyOTP(email, otp);
    res.status(200).json({ verified: isValid });
  } catch (error) {
    console.error(`Error verifying OTP: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendOTP, verifyOTP };
