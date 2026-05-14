import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const activitySchema = new mongoose.Schema({
  type: String,
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
  meta: Object
}, { _id: false });

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visibleToStudents: { type: Boolean, default: true },
  shareToken: { type: String, index: true },
  downloadCount: { type: Number, default: 0 },
  comments: [commentSchema],
  activity: [activitySchema]
}, { timestamps: true });

export default mongoose.model('FileResource', fileSchema);
