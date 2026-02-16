const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const Notification = require("../models/notification.model");

/* ================= CREATE NOTIFICATION =================
   Admin / Faculty only
*/
router.post("/", auth, async (req, res) => {
  try {
    if (!["Admin", "Faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const notification = await Notification.create({
      title,
      message,
      createdBy: {
        role: req.user.role,
        userId: req.user._id,
      },
      seenBy: [],
    });

    res.status(201).json(notification);
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

/* ================= STUDENT FETCH ================= */
router.get("/student", auth, async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Students only" });
    }

    const studentId = req.user._id.toString();

    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();

    const updated = notifications.map((n) => ({
      ...n,
      isSeen: Array.isArray(n.seenBy)
        ? n.seenBy.some(
            (s) =>
              s &&
              s.studentId &&
              s.studentId.toString() === studentId
          )
        : false,
    }));

    res.status(200).json(updated);
  } catch (err) {
    console.error("Student notification fetch error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

/* ================= STUDENT MARK AS READ ================= */
router.put("/seen/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Students only" });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const alreadySeen = notification.seenBy.some(
      (s) =>
        s &&
        s.studentId &&
        s.studentId.toString() === req.user._id.toString()
    );

    if (!alreadySeen) {
      notification.seenBy.push({
        studentId: req.user._id,
      });
      await notification.save();
    }

    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

/* ================= ADMIN / FACULTY STATS ================= */
router.get("/stats", auth, async (req, res) => {
  try {
    if (!["Admin", "Faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const notifications = await Notification.find().lean();

    const totalNotifications = notifications.length;

    const totalReadByStudents = notifications.reduce(
      (acc, n) => acc + (Array.isArray(n.seenBy) ? n.seenBy.length : 0),
      0
    );

    res.status(200).json({
      totalNotifications,
      totalReadByStudents,
    });
  } catch (err) {
    console.error("Notification stats error:", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;