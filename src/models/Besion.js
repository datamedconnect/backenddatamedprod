const mongoose = require("mongoose");
const Consultant = require("./Consultant");

const User = require("./User");

const besionSchema = new mongoose.Schema(
  {
    createdBy:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nomClient: {
      type: String,
      required: false,
      enum: [
        "inetum",
        "Hitechpros",
        "Deloitte",
        "sncf",
        "EY",
        "Macif",
        "Capgemini",
        "Open",
        "Societe_Generale",
        "Orange Business Services",
        "P&V"
      ],
    },
    dateLimite: {
      type: Date,
      required: true,
    },
    poste: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    mission: {
      type: String,
      required: true,
    },
    prixAchat: {
      type: Number,
      required: true, // Added to store purchase price
    },
    status: {
      type: String,
      required: true,
      enum: ["Ouvert", "Fermé"],
      default: "Ouvert",
    },
    consultantsScores: {
      type: [
        {
          consultantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Consultant",
            required: true,
          },
          score: {
            type: Number,
            required: true,
          },
        },
      ],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Besion", besionSchema);
