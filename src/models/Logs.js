const mongoose = require("mongoose");

const logsSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      enum: [
        "LOGIN", // User login
        "LOGOUT", // User logout
        "SLOT_CREATION", // Slot creation
        "SLOT_READ", // Slot creation
        "SLOT_UPDATE", // Slot status or details update
        "SLOT_DELETION", // Slot deletion
        "CONSULTANT_CREATION", // Consultant creation
        "BESION_DELETION",
        "CONSULTANT_UPDATE", // Consultant profile or status update
        "BESION_CREATION", // Besion creation
        "BESION_UPDATE", // Besion status or details update
        "SAVED_CONSULTANT", // Saving a consultant to a client's list
        "USER_CREATION", // User account creation
        "USER_UPDATE", // User profile update
        "INTEGRATION_ADDED", // Adding a service integration (e.g., Google)
        "CONSULTANT_READ", // Fetching qualified consultants
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["Slots", "Consultant", "Besion", "User", "SavedConsultant"],
        required: false,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
      },
    },
    metadata: {
      type: Map,
      of: String,
      required: false,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Logs", logsSchema);
