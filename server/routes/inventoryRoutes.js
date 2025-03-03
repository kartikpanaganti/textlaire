import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Inventory from "../models/Inventory.js";

const router = express.Router();

// Multer Config for Image Upload
const storage = multer.diskStorage({
  destination: "uploads/raw-materials/", // Ensure this folder exists
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ **GET all inventory items**
router.get("/", async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: "Error fetching inventory items", error: err.message });
  }
});

// ✅ **POST: Create Inventory Item**
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, category, stock } = req.body;

    if (!name || !category || stock === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const imagePath = req.file ? `/uploads/raw-materials/${req.file.filename}` : "";

    const newItem = new Inventory({
      name,
      category,
      stock,
      image: imagePath,
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: "Error adding inventory item", error: err.message });
  }
});

// ✅ **PUT: Update Inventory Item (with image update)**
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, category, stock } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // If a new image is uploaded, delete the old one
    if (req.file) {
      if (item.image) {
        const oldImagePath = path.join("uploads/product", path.basename(item.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      item.image = `/uploads/raw-materials/${req.file.filename}`;
    }

    // Update fields
    item.name = name;
    item.category = category;
    item.stock = stock;

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Error updating inventory item", error: err.message });
  }
});

// ✅ **PATCH: Update Stock Only (Avoids Unnecessary Updates)**
router.patch("/:id/stock", async (req, res) => {
  try {
    const { stock } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    if (stock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    item.stock = stock;
    await item.save();

    res.json({ message: "Stock updated", stock: item.stock });
  } catch (err) {
    res.status(500).json({ message: "Error updating stock", error: err.message });
  }
});

// ✅ **DELETE: Remove Inventory Item (with image deletion)**
router.delete("/:id", async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Delete image from local storage
    if (item.image) {
      const imagePath = path.join("uploads/product", path.basename(item.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: "Inventory item deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting inventory item", error: err.message });
  }
});

export default router;
