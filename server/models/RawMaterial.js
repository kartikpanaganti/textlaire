import mongoose from 'mongoose';

const rawMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Cotton', 'Polyester', 'Dye', 'Thread', 'Packaging', 'Other'],
    default: 'Cotton'
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    enum: ['kg', 'meters', 'rolls', 'boxes', 'liters', 'pieces'],
    default: 'kg'
  },
  unitPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  totalValue: {
    type: Number,
    default: function() {
      return (this.stock || 0) * (this.unitPrice || 0);
    }
  },
  reorderLevel: {
    type: Number,
    default: 10
  },
  location: {
    type: String,
    trim: true
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  specifications: {
    color: String,
    weight: String,
    dimensions: String,
    quality: String,
    additionalInfo: String
  },
  image: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual for stock status
rawMaterialSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock < this.reorderLevel) return 'Low Stock';
  return 'In Stock';
});

// Pre-save hook to update totalValue
rawMaterialSchema.pre('save', function(next) {
  this.totalValue = (this.stock || 0) * (this.unitPrice || 0);
  next();
});

const RawMaterial = mongoose.model('RawMaterial', rawMaterialSchema);
export default RawMaterial;