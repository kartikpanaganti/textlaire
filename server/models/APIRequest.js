import mongoose from "mongoose";

const apiRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  statusCode: {
    type: Number
  },
  responseTime: {
    type: Number // in milliseconds
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ipAddress: String
}, {
  timestamps: true
});

// Indexes for faster queries
apiRequestSchema.index({ sessionId: 1 });
apiRequestSchema.index({ userId: 1 });
apiRequestSchema.index({ timestamp: -1 });

const APIRequest = mongoose.model("APIRequest", apiRequestSchema);

export default APIRequest;
