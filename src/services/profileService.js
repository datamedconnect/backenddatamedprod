const ProfileConsultant = require("../models/ProfileConsultant");

const createProfile = async (data) => {
  try {
    const profile = new ProfileConsultant(data);
    await profile.save();
    return profile;
  } catch (error) {
    throw new Error("Failed to create profile: " + error.message);
  }
};

const updateProfile = async (profileId, newData) => {
  const profile = await ProfileConsultant.findByIdAndUpdate(profileId, newData, { new: true });
  if (!profile) {
    throw new Error("Profile not found");
  }
  return profile;
};

const getProfileById = async (id) => {
  const profile = await ProfileConsultant.findById(id);
  if (!profile) {
    throw new Error("Profile not found");
  }
  return profile;
};

const getProfileByConsultantId = async (consultantId) => {
  const profile = await ProfileConsultant.findOne({ consultantId });
  return profile; 
};

module.exports = { createProfile, updateProfile, getProfileById, getProfileByConsultantId };