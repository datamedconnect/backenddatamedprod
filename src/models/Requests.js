const mongoose = require("mongoose");
const sanitize = require('mongoose-sanitize');

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

RequestsSchema.plugin(sanitize);

module.exports = mongoose.model("Requests", RequestsSchema);