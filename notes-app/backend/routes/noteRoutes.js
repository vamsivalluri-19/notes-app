import express from "express";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  exportNotes
} from "../controllers/noteController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();


// GET NOTES
router.get("/", authMiddleware, getNotes);

// EXPORT NOTES (JSON or CSV)
router.get("/export", authMiddleware, exportNotes);


// CREATE NOTE
router.post("/", authMiddleware, createNote);


// UPDATE NOTE
router.put("/:id", authMiddleware, updateNote);


// DELETE NOTE
router.delete("/:id", authMiddleware, deleteNote);


export default router;