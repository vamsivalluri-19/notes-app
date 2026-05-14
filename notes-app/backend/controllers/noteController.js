import Note from "../models/Note.js";
import { Parser } from 'json2csv';


// GET ALL NOTES
const getNotes = async (req, res) => {

  try {
    const viewerRole = req.userRole || 'student';
    const { page = 1, limit = 20, search = '', tags, pinned, audience } = req.query;

    const filter = {};
    if (viewerRole === 'student') {
      filter.audience = { $in: ['students', 'all'] };
    } else if (audience && audience !== 'all') {
      filter.audience = audience;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length) filter.tags = { $all: tagList };
    }

    if (typeof pinned !== 'undefined') {
      if (pinned === 'true') filter.pinned = true;
      else if (pinned === 'false') filter.pinned = false;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Note.countDocuments(filter);
    const notes = await Note.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'username email role');

    res.json({ total, page: Number(page), limit: Number(limit), notes });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// CREATE NOTE
const createNote = async (req, res) => {

  try {

    const viewerRole = req.userRole || 'student';
    const { title, content, tags = [], pinned = false, audience } = req.body;

    const resolvedAudience = audience || (viewerRole === 'staff' ? 'students' : 'staff');
    const allowedAudiences = viewerRole === 'staff' ? ['students', 'staff', 'all'] : ['staff'];

    if (!allowedAudiences.includes(resolvedAudience)) {
      return res.status(400).json({ message: 'Invalid audience' });
    }

    const note = await Note.create({
      title,
      content,
      tags: Array.isArray(tags) ? tags : (String(tags).split(',').map(t=>t.trim()).filter(Boolean)),
      pinned: !!pinned,
      audience: resolvedAudience,
      createdBy: req.userId
    });

    const populated = await note.populate('createdBy', 'username email role');

    res.status(201).json(populated);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE NOTE
const updateNote = async (req, res) => {

  try {

    const existing = await Note.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Note not found' });

    const canEdit = String(existing.createdBy) === String(req.userId) || req.userRole === 'staff';
    if (!canEdit) return res.status(403).json({ message: 'Forbidden' });

    const updates = { ...req.body };
    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = String(updates.tags).split(',').map(t=>t.trim()).filter(Boolean);
    }

    if (updates.audience && req.userRole !== 'staff' && updates.audience !== 'staff') {
      return res.status(400).json({ message: 'Invalid audience' });
    }

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('createdBy', 'username email role');

    res.json(note);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE NOTE
const deleteNote = async (req, res) => {

  try {

    const existing = await Note.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Note not found' });

    const canDelete = String(existing.createdBy) === String(req.userId) || req.userRole === 'staff';
    if (!canDelete) return res.status(403).json({ message: 'Forbidden' });

    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: "Note deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export {
  getNotes,
  createNote,
  updateNote,
  deleteNote
};

// EXPORT NOTES (JSON or CSV)
const exportNotes = async (req, res) => {
  try {
    const viewerRole = req.userRole || 'student';
    const { format = 'json', search = '', tags, pinned, audience } = req.query;
    const filter = {};
    if (viewerRole === 'student') {
      filter.audience = { $in: ['students', 'all'] };
    } else if (audience && audience !== 'all') {
      filter.audience = audience;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length) filter.tags = { $all: tagList };
    }
    if (typeof pinned !== 'undefined') {
      if (pinned === 'true') filter.pinned = true;
      else if (pinned === 'false') filter.pinned = false;
    }

    const notes = await Note.find(filter).sort({ pinned: -1, createdAt: -1 }).populate('createdBy', 'username email role');

    if (format === 'csv') {
      const fields = [ 'title', 'content', 'tags', 'pinned', 'createdAt', 'updatedAt' ];
      const parser = new Parser({ fields });
      // flatten tags to string
      const data = notes.map(n=> ({
        title: n.title,
        content: n.content,
        tags: (n.tags||[]).join(','),
        pinned: n.pinned,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt
      }));
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('notes-export.csv');
      return res.send(csv);
    }

    // default JSON
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { exportNotes };