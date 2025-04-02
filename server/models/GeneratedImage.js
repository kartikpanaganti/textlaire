import mongoose from "mongoose";

const generatedImageSchema = new mongoose.Schema({
  originalImage: {
    type: String,  // URL or base64 of the source image
    required: true
  },
  generatedImage: {
    type: String,  // URL or base64 of the generated image
    required: true
  },
  prompt: {
    type: String,  // The text prompt used for generation
    required: true
  },
  seed: {
    type: Number,  // The random seed used for generation
    default: 0
  },
  strength: {
    type: Number,  // The transformation strength (0-1)
    default: 0.7
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false  // Optional, for user-specific image history
  }
}, {
  timestamps: true
});

export default mongoose.model("GeneratedImage", generatedImageSchema); 