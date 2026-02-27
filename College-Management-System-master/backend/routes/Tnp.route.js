const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");
const ctrl = require("../controllers/Tnp.controller");

// pdf
router.get("/export/:driveId/:status", auth, ctrl.exportDriveApplications);
// csv
router.get(
  "/export-csv/:driveId/:status",
  auth,
  ctrl.exportDriveApplicationsCSV,
);
router.patch(
  "/drive/:driveId/application/:applicationId/status",
  auth,
  ctrl.updateApplicationStatus,
);
/* =========================================
   EXISTING NOTICE ROUTES
========================================= */

router.get("/", auth, ctrl.getAllTnp);
router.post("/", auth, ctrl.createTnp);
router.put("/:id", auth, ctrl.updateTnp);
router.delete("/:id", auth, ctrl.deleteTnp);
router.patch("/:id/seen", auth, ctrl.toggleSeen);

/* =========================================
   DRIVE ROUTES
========================================= */

/* Create Placement Drive (Admin / Faculty) */
router.post(
  "/drive",
  auth,
  upload.single("attachment"), // 🔥 CHANGED HERE
  ctrl.createDrive,
);

/* Get All Drives */
router.get("/drive", auth, ctrl.getAllDrives);

/* Get Single Drive Details */
router.get("/drive/:id", auth, ctrl.getDriveDetails);
router.put("/drive/:id", auth, ctrl.updateDrive);
router.delete("/drive/:id", auth, ctrl.deleteDrive);

/* Apply to Drive (Student) */
router.post(
  "/drive/:id/apply",
  auth,
  upload.single("resume"),
  ctrl.applyToDrive,
);

/* Auto Shortlist (Admin / Faculty) */
router.put("/drive/:id/shortlist", auth, ctrl.autoShortlist);

module.exports = router;
