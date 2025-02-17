import express from "express";
import Employee from "../models/Employee.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const employees = await Employee.find();
    res.json(employees);
});

router.post("/", async (req, res) => {
    const newEmployee = new Employee(req.body);
    await newEmployee.save();
    res.json({ message: "Employee added" });
});

router.put("/:id", async (req, res) => {
    await Employee.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Employee updated" });
});

router.delete("/:id", async (req, res) => {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted" });
});

export default router;
