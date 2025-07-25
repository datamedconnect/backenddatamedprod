const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const sanitize = require('mongoose-sanitize');


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
    enum: ["Activé", "Désactivé"],
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
  // Add this new field
  last_verified_at: { type: Date, default: null },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.plugin(sanitize);


module.exports = mongoose.model("User", userSchema);
