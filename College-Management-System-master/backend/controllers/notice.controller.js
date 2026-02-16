const Notice = require("../models/notice.model");

/* ================= CREATE NOTICE =================
   Admin / Faculty only
*/
const createNotice = async (req, res) => {
  try {
    if (!req.user || !["Admin", "Faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, message, type } = req.body;

    if (!title || !message || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const notice = await Notice.create({
      title,
      message,
      type,
      createdBy: {
        role: req.user.role,
        userId: req.user._id,
      },
      seenBy: [],
    });

    res.status(201).json(notice);
  } catch (err) {
    console.error("Create notice error:", err);
    res.status(500).json({ message: "Failed to create notice" });
  }
};

/* ================= MARK AS SEEN =================
   Student only
*/
const markNoticeAsSeen = async (req, res) => {
  try {
    if (!req.user || !req.user._id || req.user.role !== "Student") {
      return res.status(403).json({ message: "Students only" });
    }

    const noticeId = req.params.id;
    const userId = req.user._id.toString();

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const alreadySeen = Array.isArray(notice.seenBy)
      ? notice.seenBy.some(
          (s) => s && s.userId && s.userId.toString() === userId
        )
      : false;

    if (!alreadySeen) {
      notice.seenBy.push({
        userId: req.user._id,
        userRole: "Student",
        seenAt: new Date(),
      });
      await notice.save();
    }

    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error("Mark seen error:", err);
    res.status(500).json({ message: "Mark seen failed" });
  }
};

/* ================= DELETE NOTICE =================
   Admin / Faculty only
*/
const deleteNotice = async (req, res) => {
  try {
    if (!req.user || !["Admin", "Faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.status(200).json({ message: "Notice deleted" });
  } catch (err) {
    console.error("Delete notice error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

module.exports = {
  createNotice,
  markNoticeAsSeen,
  deleteNotice,
};
