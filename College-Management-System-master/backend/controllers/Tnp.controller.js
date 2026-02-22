const Tnp = require("../models/Tnp.model");
const Student = require("../models/details/student-details.model");
const Marks = require("../models/marks.model");

/* =========================================================
   NOTICE CONTROLLERS
========================================================= */

exports.getAllTnp = async (req, res) => {
  try {
    const list = await Tnp.find({ type: "NOTICE" }).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

exports.createTnp = async (req, res) => {
  try {
    const tnp = new Tnp({
      ...req.body,
      type: "NOTICE",
      createdBy: req.user._id,
      createdByRole: req.user.role,
    });

    await tnp.save();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false });
  }
};

exports.updateTnp = async (req, res) => {
  try {
    await Tnp.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false });
  }
};

exports.deleteTnp = async (req, res) => {
  try {
    await Tnp.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false });
  }
};

exports.toggleSeen = async (req, res) => {
  try {
    const tnp = await Tnp.findById(req.params.id);
    if (!tnp) return res.status(404).json({ success: false });

    const index = tnp.seenBy.findIndex(
      (u) => u.userId.toString() === req.user._id.toString()
    );

    if (index === -1) {
      tnp.seenBy.push({ userId: req.user._id, role: req.user.role });
    } else {
      tnp.seenBy.splice(index, 1);
    }

    await tnp.save();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false });
  }
};

/* =========================================================
   DRIVE CONTROLLERS
========================================================= */

exports.createDrive = async (req, res) => {
  try {
    if (!["admin", "faculty"].includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ success: false });
    }

    const drive = new Tnp({
      ...req.body,
      type: "DRIVE",

      // 🔥 NEW HYBRID LOGIC
      googleFormLink: req.body.googleFormLink || null,
      attachment: req.file ? req.file.filename : null,

      createdBy: req.user._id,
      createdByRole: req.user.role,
    });

    await drive.save();

    res.json({ success: true, data: drive });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false });
  }
};

exports.getAllDrives = async (req, res) => {
  try {
    const drives = await Tnp.find({ type: "DRIVE" })
      .populate("eligibleBranches")
      .populate({
        path:"applications.studentId",
        select:"middleName email branchId enrollmentNo"
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: drives });
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

exports.getDriveDetails = async (req, res) => {
  try {
    const drive = await Tnp.findById(req.params.id)
      .populate("eligibleBranches")
      .populate("applications.studentId");

    if (!drive) return res.status(404).json({ success: false });

    res.json({ success: true, data: drive });
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

exports.applyToDrive = async (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "student") {
      return res.status(403).json({ success: false });
    }

    const drive = await Tnp.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false });

    if (drive.deadline && new Date(drive.deadline) < new Date()) {
      drive.isExpired = true;
      await drive.save();
      return res.status(400).json({
        success: false,
        message: "Drive expired",
      });
    }

    const student = await Student.findById(req.user._id);
    if (!student)
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });

    if (student.placementStatus === "PLACED") {
      return res.status(400).json({
        success: false,
        message: "You are already placed",
      });
    }

    const alreadyApplied = drive.applications.find(
      (a) => a.studentId.toString() === student._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "Already applied",
      });
    }

    if (
      drive.eligibleBranches.length > 0 &&
      !drive.eligibleBranches.some(
        (b) => b.toString() === student.branchId.toString()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Branch not eligible",
      });
    }

    const studentMarks = await Marks.find({ studentId: student._id });

    if (studentMarks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No marks available",
      });
    }

    const totalMarks = studentMarks.reduce(
      (sum, m) => sum + m.marksObtained,
      0
    );

    const averageMarks = totalMarks / studentMarks.length;

    if (drive.minMarks && averageMarks < drive.minMarks) {
      return res.status(400).json({
        success: false,
        message: "Marks criteria not satisfied",
      });
    }

    drive.applications.push({
      studentId: student._id,
      branchId: student.branchId,
      marks: averageMarks,
      resume: req.file ? req.file.filename : null,
      status: "APPLIED",
    });

    await drive.save();

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false });
  }
};

exports.autoShortlist = async (req, res) => {
  try {
    if (!["admin", "faculty"].includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ success: false });
    }

    const drive = await Tnp.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false });

    drive.applications.forEach((app) => {
      app.status = "SHORTLISTED";
    });

    await drive.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    if (!["admin", "faculty"].includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ success: false });
    }

    const { driveId, applicationId } = req.params;
    const { status } = req.body;

    const drive = await Tnp.findById(driveId);
    if (!drive) return res.status(404).json({ success: false });

    const application = drive.applications.id(applicationId);
    if (!application)
      return res.status(404).json({ success: false });

    application.status = status;

    if (status === "SELECTED") {
      await Student.findByIdAndUpdate(application.studentId, {
        placementStatus: "PLACED",
      });
    }

    await drive.save();

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false });
  }
};