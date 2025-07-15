const mongoose = require("mongoose");

const consultantSchema = new mongoose.Schema(
  {
    Email: String,
    Phone: String,
    MissionType: String,
    TjmOrSalary: String,
    Age: { type: Number, required: false },
    Location: [String], // Array of strings for multiple locations
    Profile: { type: mongoose.Schema.Types.ObjectId, ref: "ProfileConsultant" },
    qualifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sourcedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Qualifié", "Non Qualifié", "En Attente"],
      default: "En Attente",
    },
    datamedFamily: {
      type: Boolean,
      default: false,
    },
    available: {
      type: Date,
    },
    lastUpdated: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure Location is always an array
consultantSchema.pre("save", function (next) {
  if (this.Location && !Array.isArray(this.Location)) {
    this.Location = [this.Location];
    console.log(
      `Pre-save: Converted Location to array for consultant ${this._id}:`,
      this.Location,
    );
  } else if (!this.Location) {
    this.Location = [];
    console.log(
      `Pre-save: Set Location to empty array for consultant ${this._id}`,
    );
  }
  next();
});

consultantSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if ("Location" in update) {
    // Only process Location if it’s explicitly included
    if (update.Location && !Array.isArray(update.Location)) {
      update.Location = [update.Location];
      console.log(
        `Pre-update: Converted Location to array for update:`,
        update.Location,
      );
    } else if (update.Location === null) {
      update.Location = [];
      console.log(`Pre-update: Set Location to empty array for update`);
    }
  }
  if (update.qualifiedBy) {
    console.log(
      `Pre-update: Setting qualifiedBy to ${
        update.qualifiedBy
      } for consultant ID ${this.getQuery()._id}`,
    );
  }
  if (update.sourcedBy) {
    console.log(
      `Pre-update: Setting sourcedBy to ${
        update.sourcedBy
      } for consultant ID ${this.getQuery()._id}`,
    );
  }
  next();
});

module.exports = mongoose.model("Consultant", consultantSchema);
