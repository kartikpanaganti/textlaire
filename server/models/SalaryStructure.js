import mongoose from "mongoose";

const salaryComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Earning', 'Deduction', 'Statutory'],
    required: true
  },
  calculationType: {
    type: String,
    enum: ['Fixed', 'Percentage', 'Formula', 'Manual'],
    default: 'Fixed'
  },
  value: {
    type: Number,
    required: true,
    default: 0
  },
  baseComponent: {
    type: String,
    default: 'Basic'
  },
  formula: {
    type: String,
    default: ''
  },
  taxable: {
    type: Boolean,
    default: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
});

const salaryGradeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  minSalary: {
    type: Number,
    required: true
  },
  maxSalary: {
    type: Number,
    required: true
  },
  components: [salaryComponentSchema],
  isActive: {
    type: Boolean,
    default: true
  }
});

const salaryStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: String,
  effectiveFrom: {
    type: Date,
    required: true
  },
  effectiveTo: Date,
  components: [salaryComponentSchema],
  grades: [salaryGradeSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
salaryStructureSchema.index({ name: 1 });
salaryStructureSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
salaryStructureSchema.index({ isActive: 1 });

export default mongoose.model("SalaryStructure", salaryStructureSchema);
