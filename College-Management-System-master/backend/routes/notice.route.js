const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const Notice = require("../models/notice.model");

/* ================= CREATE NOTICE =================
   Admin / Faculty only
*/
router.post("/", auth, async (req, res) => {
  try {
    if (!["Admin", "Faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const notice = await Notice.create({
      title,
      message,
      type: type || "student", // student | both
      createdBy: {
        userId: req.user._id,
        role: req.user.role,
      },
      seenBy: [],
    });

    res.status(201).json(notice);
  } catch (err) {
    console.error("Create notice error:", err);
    res.status(500).json({ message: "Failed to create notice" });
  }
});

/* ================= ADMIN / FACULTY FETCH ================= */
router.get("/", auth, async (req, res) => {
  try {
    if (!["Admin", "Faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (err) {
    console.error("Fetch notices error:", err);
    res.status(500).json({ message: "Failed to fetch notices" });
  }
});

/* ================= STUDENT FETCH ================= */
router.get("/student", auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const studentId = req.user._id.toString();

    const notices = await Notice.find({
      type: { $in: ["student", "both"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const updated = notices.map((n) => {
      const isSeen = Array.isArray(n.seenBy)
        ? n.seenBy.some(
            (s) => s?.userId?.toString() === studentId
          )
        : false;

      return { ...n, isSeen };
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error("Student notice error:", err);
    res.status(500).json({ message: "Failed to fetch student notices" });
  }
});

/* ================= MARK AS SEEN (STUDENT) ================= */
router.put("/seen/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Students only" });
    }

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const alreadySeen = notice.seenBy.some(
      (s) => s.userId.toString() === req.user._id.toString()
    );

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
    res.status(500).json({ message: "Mark as read failed" });
  }
});

/* ================= STUDENT COUNT ================= */
router.get("/student/count", auth, async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({ message: "Students only" });
    }

    const notices = await Notice.find({
      type: { $in: ["student", "both"] },
    }).lean();

    let read = 0;
    let unread = 0;

    notices.forEach((n) => {
      const seen = n.seenBy?.some(
        (s) => s.userId.toString() === req.user._id.toString()
      );
      seen ? read++ : unread++;
    });

    res.status(200).json({
      total: notices.length,
      read,
      unread,
    });
  } catch (err) {
    console.error("Count error:", err);
    res.status(500).json({ message: "Count fetch failed" });
  }
});

// ===== ADMIN / FACULTY NOTICE COUNT =====
router.get("/count", auth, async (req, res) => {
  try {
    const notices = await Notice.find().lean();

    let read = 0;
    let unread = 0;

    notices.forEach((n) => {
      if (Array.isArray(n.seenBy) && n.seenBy.length > 0) {
        read++;
      } else {
        unread++;
      }
    });

    res.json({ read, unread });
  } catch (err) {
    res.status(500).json({ message: "Count failed" });
  }
});

/* ================= DELETE NOTICE =================
   Admin / Faculty only
*/
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!["Admin", "Faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Notice.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notice deleted" });
  } catch (err) {
    console.error("Delete notice error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
