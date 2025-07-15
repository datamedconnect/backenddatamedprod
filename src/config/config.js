require("dotenv").config();

module.exports = {
  secret: process.env.JWT_SECRET || "your_jwt_secret_key",
};
