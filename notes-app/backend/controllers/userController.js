import User from "../models/User.js";
import Note from "../models/Note.js";

const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('username email role createdAt')
      .sort({ createdAt: -1 });

    const activity = await Note.aggregate([
      {
        $group: {
          _id: '$createdBy',
          noteCount: { $sum: 1 },
          latestNoteAt: { $max: '$createdAt' }
        }
      }
    ]);

    const activityByUser = new Map(activity.map(item => [String(item._id), item]));

    const roster = students.map(student => {
      const stats = activityByUser.get(String(student._id)) || {};
      return {
        ...student.toObject(),
        noteCount: stats.noteCount || 0,
        latestNoteAt: stats.latestNoteAt || null
      };
    });

    res.json({ students: roster, total: roster.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getStudents };