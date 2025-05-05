import mongoose from "mongoose";

const pageViewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  title: {
    type: String
  },
  referrer: {
    type: String
  },
  duration: {
    type: Number // in seconds
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
pageViewSchema.index({ sessionId: 1 });
pageViewSchema.index({ userId: 1 });
pageViewSchema.index({ timestamp: -1 });
pageViewSchema.index({ path: 1 });

const PageView = mongoose.model("PageView", pageViewSchema);

export default PageView;
