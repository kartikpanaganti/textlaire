import mongoose from 'mongoose';

const productPatternSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  type: {
    type: String
  },
  material: {
    type: String
  },
  color: {
    type: String
  },
  dimensions: {
    type: String
  },
  price: {
    type: String
  },
  prompt: {
    type: String
  },
  seed: {
    type: String
  },
  imageUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('ProductPattern', productPatternSchema); 