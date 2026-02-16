const adminDetails = require("./models/details/admin-details.model");
const connectToMongo = require("./database/db");
const mongoose = require("mongoose");

const seedData = async () => {
  try {
    await connectToMongo();

    // Clear existing admin data
    await adminDetails.deleteMany({});

    const password = "admin123";
    const employeeId = 123456;

    const adminDetail = {
      employeeId: employeeId,
      firstName: "Surya",
      middleName: "S",
      lastName: "Raj",
      email: "suryarajsarimalla@gmail.com",
      phone: "8125883892",
      profile: "1769933150743.jpeg",
      address: "kothapet,chirala",
      city: "Chirala",
      state: "Andhra Pradesh",
      pincode: "523155",
      country: "India",
      gender: "male",
      dob: new Date("2003-12-28"),
      designation: "System Administrator",
      joiningDate: new Date(),
      salary: 50000,
      status: "active",
      isSuperAdmin: true,
      emergencyContact: {
        name: "Emergency Contact",
        relationship: "mother",
        phone: "8555881598",
      },
      bloodGroup: "O+",
      password: password,
    };

    await adminDetails.create(adminDetail);

    console.log("\n=== Admin Credentials ===");
    console.log("Employee ID:", employeeId);
    console.log("Password:", password);
    console.log("Email:", adminDetail.email);
    console.log("=======================\n");
    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error while seeding:", error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedData();
