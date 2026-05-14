import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  content: {
    type: String,
    required: true,
  },

  tags: {
    type: [String],
    default: []
  },

  pinned: {
    type: Boolean,
    default: false
  },

  audience: {
    type: String,
    enum: ['students', 'staff', 'all'],
    default: 'students'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

}, {
  timestamps: true
});

export default mongoose.model("Note", noteSchema);