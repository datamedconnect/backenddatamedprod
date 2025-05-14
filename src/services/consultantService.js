const Consultant = require("../models/Consultant");

const updateConsultant = async (consultantId, newData) => {
  const consultant = await Consultant.findByIdAndUpdate(consultantId, newData, {
    new: true,
  });
  if (!consultant) {
    throw new Error("Consultant not found");
  }
  return consultant;
};

const getConsultantById = async (id) => {
  const consultant = await Consultant.findById(id);
  if (!consultant) {
    throw new Error("Consultant not found");
  }
  return consultant;
};

const createConsultant = async (data) => {
  try {
    const consultant = new Consultant(data);
    await consultant.save();
    return consultant;
  } catch (error) {
    throw new Error(`Failed to create consultant: ${error.message}`);
  }
};

const getConsultantByProfileId = async (profileId) => {
  const consultant = await Consultant.findOne({ Profile: profileId });
  if (!consultant) {
    throw new Error("Consultant not found for this profile");
  }
  return consultant;
};

module.exports = {
  updateConsultant,
  getConsultantById,
  getConsultantByProfileId,
  createConsultant,
};