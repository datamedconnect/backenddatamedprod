const mongoose = require("mongoose");
const Consultant = require("./Consultant");
const User = require("./User");
const sanitize = require('mongoose-sanitize');


const slotsSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exchangeNumber: {
      type: String,
      default: function () {
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `ECH-${rand}`;
      },
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    consultants: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultant",
      required: true,
    },
    status: {
      type: String,
      enum: ["En Attente", "Confirmé", "Reporté"],
      default: "En Attente",
    },
    timeSlots: {
      type: [
        {
          date: {
            type: Date,
            required: true,
          },
          day: {
            type: String,
            enum: [
              "Lundi",
              "Mardi",
              "Mercredi",
              "Jeudi",
              "Vendredi",
              "Samedi",
              "Dimanche",
            ],
            required: true,
          },
          startTime: {
            type: String,
            required: true,
          },
          finishTime: {
            type: String,
            required: true,
          },
        },
      ],
      validate: [arrayLimit, "Time slots cannot exceed 3 entries"],
    },
    selectedTimeSlot: {
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      date: {
        type: Date,
      },
      day: {
        type: String,
        enum: [
          "Lundi",
          "Mardi",
          "Mercredi",
          "Jeudi",
          "Vendredi",
          "Samedi",
          "Dimanche",
        ],
      },
      startTime: {
        type: String,
      },
      finishTime: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  },
);

function arrayLimit(val) {
  return val.length <= 3;
}

slotsSchema.plugin(sanitize);

module.exports = mongoose.model("Slots", slotsSchema);
