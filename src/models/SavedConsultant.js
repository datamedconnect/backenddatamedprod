const mongoose = require("mongoose");

const savedConsultantSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  consultant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant",
    required: true,
  },
});

savedConsultantSchema.index({ client: 1, consultant: 1 }, { unique: true });

module.exports = mongoose.model("SavedConsultant", savedConsultantSchema);
