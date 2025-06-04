const Notification = require("../models/Notification");

// Fetch notifications with optional read filter
const getNotifications = async (req, res) => {
  try {
    const { read } = req.query;
    const query = { user: req.user.id };
    if (read !== undefined) {
      query.read = read === "true";
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark a notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    notification.read = true;
    await notification.save();
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getNotifications, markNotificationAsRead };