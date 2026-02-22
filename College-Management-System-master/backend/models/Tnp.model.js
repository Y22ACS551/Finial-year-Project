const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentDetail",
      required: true,
    },

    resume: {
      type: String,
      default: null,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    marks: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["APPLIED", "SHORTLISTED", "SELECTED", "REJECTED"],
      default: "APPLIED",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const TnpSchema = new mongoose.Schema(
  {
    /* =========================
       NOTICE FIELDS
    ========================== */

    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByRole",
    },

    createdByRole: {
      type: String,
      enum: ["Admin", "Faculty"],
      required: true,
    },

    seenBy: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        role: String,
      },
    ],

    /* =========================
       DRIVE FIELDS
    ========================== */

    type: {
      type: String,
      enum: ["NOTICE", "DRIVE"],
      default: "NOTICE",
    },

    companyName: String,
    jobRole: String,
    brochure: String,

    eligibleBranches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],

    minMarks: Number,

    /* =========================
       🔥 NEW HYBRID FIELDS
    ========================== */

    googleFormLink: {
      type: String,
      default: null,
    },

    attachment: {
      type: String,
      default: null,
    },

    applications: [ApplicationSchema],

    isExpired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

TnpSchema.pre("save", function (next) {
  if (this.deadline && new Date(this.deadline) < new Date()) {
    this.isExpired = true;
  }
  next();
});

module.exports = mongoose.model("Tnp", TnpSchema);