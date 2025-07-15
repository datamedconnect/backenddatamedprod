const mongoose = require("mongoose");

const RequestsSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    email: { type: String, required: true },
    commentaires: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Requests", RequestsSchema);
