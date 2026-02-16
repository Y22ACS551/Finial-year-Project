const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");
const ctrl = require("../controllers/Tnp.controller");

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
  upload.single("brochure"),
  ctrl.createDrive
);

/* Get All Drives */
router.get("/drive", auth, ctrl.getAllDrives);

/* Get Single Drive Details */
router.get("/drive/:id", auth, ctrl.getDriveDetails);

/* Apply to Drive (Student) */
router.post(
  "/drive/:id/apply",
  auth,
  upload.single("resume"),
  ctrl.applyToDrive
);

/* Auto Shortlist (Admin / Faculty) */
router.put(
  "/drive/:id/shortlist",
  auth,
  ctrl.autoShortlist
);

/* Update Application Status */
router.put(
  "/drive/:driveId/application/:applicationId",
  auth,
  ctrl.updateApplicationStatus
);

module.exports = router;