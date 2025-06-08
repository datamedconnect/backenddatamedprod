const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

const getAllavaibility = async (req, res) => {};

module.exports = {
  getAllavaibility,
};
