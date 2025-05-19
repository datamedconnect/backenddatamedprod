const mongoose = require("mongoose");

const consultantSchema = new mongoose.Schema({
  Email: String,
  Phone: String,
  MissionType: String,
  TjmOrSalary: String,
  Age: { type: Number, required: false },
  Location: String,
  Profile: { type: mongoose.Schema.Types.ObjectId, ref: "ProfileConsultant" },
  status: {
    type: String,
    enum: ["Qualifié", "Non Qualifié", "En Attente"],
    default: "En Attente"
  },
  datamedFamily:{
    type: Boolean,
    default: false
  },
  available: {
    type: Date // Corrected from 'date' to 'Date'
  }
},
{
  timestamps: true, 
});

module.exports = mongoose.model("Consultant", consultantSchema);