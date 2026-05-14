import FileResource from "../models/FileResource.js";
import path from "path";
import crypto from 'crypto';

const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const visible = req.body.visibleToStudents !== undefined ? (String(req.body.visibleToStudents) === 'true') : true;

    const shareToken = crypto.randomBytes(12).toString('hex');

    const file = await FileResource.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploader: req.userId, // set by auth middleware
      visibleToStudents: visible,
      shareToken,
      activity: [{ type: 'upload', by: req.userId, meta: { originalName: req.file.originalname } }]
    });

    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const filter = { visibleToStudents: true };
    if (search) filter.originalName = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await FileResource.countDocuments(filter);
    const files = await FileResource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('uploader', 'username email');

    res.json({ total, page: Number(page), limit: Number(limit), files });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listStaffFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const filter = { uploader: req.userId };
    if (search) filter.originalName = { $regex: search, $options: 'i' };
    const skip = (Number(page) - 1) * Number(limit);
    const total = await FileResource.countDocuments(filter);
    const files = await FileResource.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('uploader', 'username email');
    res.json({ total, page: Number(page), limit: Number(limit), files });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleVisibility = async (req, res) => {
  try {
    const file = await FileResource.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Not found' });
    if (String(file.uploader) !== String(req.userId)) return res.status(403).json({ message: 'Forbidden' });
    file.visibleToStudents = !file.visibleToStudents;
    file.activity.push({ type: 'visibility', by: req.userId, meta: { visible: file.visibleToStudents } });
    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateShare = async (req, res) => {
  try {
    const file = await FileResource.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Not found' });
    if (String(file.uploader) !== String(req.userId)) return res.status(403).json({ message: 'Forbidden' });
    if (!file.shareToken) file.shareToken = crypto.randomBytes(12).toString('hex');
    file.activity.push({ type: 'share-generated', by: req.userId, meta: {} });
    await file.save();
    res.json({ shareUrl: `${req.protocol}://${req.get('host')}/api/files/shared/${file.shareToken}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// public access via share token
const getByShareToken = async (req, res) => {
  try {
    const file = await FileResource.findOne({ shareToken: req.params.token });
    if (!file) return res.status(404).json({ message: 'Not found' });
    // stream file
    const filePath = path.join(process.cwd(), 'uploads', file.filename);
    // increment download and log
    file.downloadCount = (file.downloadCount || 0) + 1;
    file.activity.push({ type: 'download', by: null, meta: { viaShare: true } });
    await file.save();
    return res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const file = await FileResource.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Not found' });
    const comment = { author: req.userId, text: req.body.text };
    file.comments.push(comment);
    file.activity.push({ type: 'comment', by: req.userId, meta: { text: req.body.text } });
    await file.save();
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const incrementDownload = async (req, res) => {
  try {
    const file = await FileResource.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Not found' });
    file.downloadCount = (file.downloadCount || 0) + 1;
    file.activity.push({ type: 'download', by: req.userId || null });
    await file.save();
    res.json({ downloadCount: file.downloadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActivity = async (req, res) => {
  try {
    const file = await FileResource.findById(req.params.id).populate('activity.by', 'username email');
    if (!file) return res.status(404).json({ message: 'Not found' });
    res.json(file.activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { uploadFile, listFiles, listStaffFiles, toggleVisibility, generateShare, getByShareToken, addComment, incrementDownload, getActivity };
