// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["client", "admin", "superadmin"],
  },
  phoneNumber: { type: String },
  name: { type: String },
  companyName: { type: String },
  status: {
    type: String,
    enum: ["Activé", "Désactivé"], // Corrected to "Désactivé"
    default: "Activé",
  },
  integrations: [
    {
      service: { type: String, enum: ["google"], required: true },
      email: { type: String, required: true },
      tokens: {
        access_token: { type: String, required: true },
        refresh_token: { type: String },
        expiry_date: { type: Number },
      },
    },
  ],
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
