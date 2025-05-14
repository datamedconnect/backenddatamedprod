const Logs = require('../models/Logs'); // Adjust the path to your Logs model

const getAllLogs = async (req, res) => {
  try {
    const logs = await Logs.find()
      .populate('user', 'email') // Populate the user's email
      .sort({ createdAt: -1 }); // Sort by timestamp, newest first
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
};

module.exports = { getAllLogs };