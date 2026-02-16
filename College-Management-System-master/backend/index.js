const connectToMongo = require("./database/db");
const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

// DB connection
connectToMongo();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_API_LINK || "*",
  })
);

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Hello 👋I am Working Fine 🚀🚀");
});

// Static files
app.use("/media", express.static(path.join(__dirname, "media")));

// DETAILS ROUTES
app.use("/api/admin", require("./routes/details/admin-details.route"));
app.use("/api/faculty", require("./routes/details/faculty-details.route"));
app.use("/api/student", require("./routes/details/student-details.route"));

// MAIN ROUTES
app.use("/api/branch", require("./routes/branch.route"));
app.use("/api/subject", require("./routes/subject.route"));
app.use("/api/notices", require("./routes/notice.route")); // âœ… correct
app.use("/api/timetable", require("./routes/timetable.route"));
app.use("/api/material", require("./routes/material.route"));
app.use("/api/exam", require("./routes/exam.route"));
app.use("/api/marks", require("./routes/marks.route"));
app.use("/api/tnp", require("./routes/Tnp.route"));



// Server start
app.listen(port, () => {
  console.log(`✅ Server Listening On http://localhost:${port}`);
});
