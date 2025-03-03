import mongoose from "mongoose";

const rawmaterialsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, required: true },
  image: { type: String },
});

export default mongoose.model("raw-materials", rawmaterialsSchema);
