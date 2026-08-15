import { Router } from 'express';
import {
  getBoardWithColumnsAndTasks,
  getTaskCountsPerColumn,
  getTasksByPriority,
} from '../db/queries.js';

const router = Router();

// GET /api/boards/:id  -> full board with columns + tasks
router.get('/:id', (req, res) => {
  const board = getBoardWithColumnsAndTasks(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found.' });
  }
  res.json(board);
});

// GET /api/boards/:id/task-counts -> tasks per column (uses SQL GROUP BY, not JS filtering)
router.get('/:id/task-counts', (req, res) => {
  const board = getBoardWithColumnsAndTasks(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found.' });
  }
  res.json(getTaskCountsPerColumn(req.params.id));
});

// GET /api/boards/:id/tasks?priority=High -> tasks filtered by priority, newest first
router.get('/:id/tasks', (req, res) => {
  const board = getBoardWithColumnsAndTasks(req.params.id);
  if (!board) {
    return res.status(404).json({ error: 'Board not found.' });
  }
  const { priority } = req.query;
  if (!priority) {
    return res.status(400).json({ error: 'A priority query parameter is required.' });
  }
  res.json(getTasksByPriority(req.params.id, priority));
});

export default router;
