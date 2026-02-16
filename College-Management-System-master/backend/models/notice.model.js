const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // who should see this notice
    // student | both
    type: {
      type: String,
      enum: ["student", "both"],
      default: "student",
    },

    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "createdBy.role",
      },
      role: {
        type: String,
        enum: ["Admin", "Faculty"],
        required: true,
      },
    },

    // students who read the notice
    seenBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
        userRole: {
          type: String,
          default: "Student",
        },
        seenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);
