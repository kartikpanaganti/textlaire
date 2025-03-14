import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true
  },
  material: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  dimensions: {
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inches', 'mm'],
      default: 'cm'
    }
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP'],
      default: 'USD'
    }
  },
  quality: {
    type: String,
    enum: ['premium', 'standard', 'economy'],
    default: 'standard'
  },
  weight: {
    type: Number, // GSM (Grams per Square Meter)
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  imageData: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  seed: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Product', productSchema); 