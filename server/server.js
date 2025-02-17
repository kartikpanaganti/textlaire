import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import employeeRoutes from "./routes/employeeRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Use employee routes
app.use("/api/employees", employeeRoutes);

// Default Route
app.get("/", (req, res) => {
  res.send("Workforce Management API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
