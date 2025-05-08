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
    trim: true,
    validate: {
      validator: function(v) {
        return v === null || v === undefined || v.trim().length > 0;
      },
      message: 'Code cannot be an empty string'
    },
    set: function(v) {
      return v === '' ? null : v;
    }
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
  width: {
    type: String
  },
  height: {
    type: String
  },
  unit: {
    type: String,
    default: 'cm'
  },
  price: {
    type: String
  },
  currency: {
    type: String,
    default: 'INR'
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
  description: {
    type: String
  },
  tags: {
    type: [String],
    default: []
  },
  qualityGrade: {
    type: String,
    enum: ['premium', 'standard', 'economy'],
    default: 'premium'
  },
  weight: {
    type: String,
    default: '400'
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

productPatternSchema.index({ code: 1 }, { unique: true, sparse: true });

export default mongoose.model('ProductPattern', productPatternSchema); 