const mongoose = require("mongoose");

const consultantSchema = new mongoose.Schema({
  Email: String,
  Phone: String,
  MissionType: String,
  TjmOrSalary: String,
  Age: { type: Number, required: false },
  Location: [String], // Array of strings for multiple locations
  Profile: { type: mongoose.Schema.Types.ObjectId, ref: "ProfileConsultant" },
  status: {
    type: String,
    enum: ["Qualifié", "Non Qualifié", "En Attente"],
    default: "En Attente"
  },
  datamedFamily: {
    type: Boolean,
    default: false
  },
  available: {
    type: Date
  }
}, {
  timestamps: true,
});

// Ensure Location is always an array
consultantSchema.pre('save', function(next) {
  if (this.Location && !Array.isArray(this.Location)) {
    this.Location = [this.Location];
    console.log(`Pre-save: Converted Location to array for consultant ${this._id}:`, this.Location);
  } else if (!this.Location) {
    this.Location = [];
    console.log(`Pre-save: Set Location to empty array for consultant ${this._id}`);
  }
  next();
});

// Ensure updates to Location are arrays
consultantSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.Location && !Array.isArray(update.Location)) {
    update.Location = [update.Location];
    console.log(`Pre-update: Converted Location to array for update:`, update.Location);
  } else if (update.Location === null || update.Location === undefined) {
    update.Location = [];
    console.log(`Pre-update: Set Location to empty array for update`);
  }
  next();
});

module.exports = mongoose.model("Consultant", consultantSchema);