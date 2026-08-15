import { Router } from 'express';
import {
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getColumnById,
  getTaskById,
} from '../db/queries.js';

const router = Router();

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

function isBlank(value) {
  return value === undefined || value === null || String(value).trim().length === 0;
}

// POST /api/tasks
router.post('/', (req, res) => {
  const { columnId, title, description, priority } = req.body ?? {};

  if (isBlank(title)) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (isBlank(columnId)) {
    return res.status(400).json({ error: 'columnId is required.' });
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'Priority must be Low, Medium, or High.' });
  }

  const column = getColumnById(columnId);
  if (!column) {
    return res.status(400).json({ error: 'That column does not exist.' });
  }

  const task = createTask({ columnId, title: title.trim(), description, priority });
  res.status(201).json(task);
});

// PATCH /api/tasks/:id  (edit title/description/priority)
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, priority } = req.body ?? {};

  if (title !== undefined && isBlank(title)) {
    return res.status(400).json({ error: 'Title cannot be empty.' });
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'Priority must be Low, Medium, or High.' });
  }

  const existing = getTaskById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const task = updateTask(id, {
    title: title !== undefined ? title.trim() : undefined,
    description,
    priority,
  });
  res.json(task);
});

// PATCH /api/tasks/:id/move  (move to a different column)
router.patch('/:id/move', (req, res) => {
  const { id } = req.params;
  const { columnId } = req.body ?? {};

  if (isBlank(columnId)) {
    return res.status(400).json({ error: 'columnId is required.' });
  }

  const existing = getTaskById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const column = getColumnById(columnId);
  if (!column) {
    return res.status(400).json({ error: 'That column does not exist.' });
  }

  const task = moveTask(id, columnId);
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = getTaskById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  deleteTask(id);
  res.status(204).send();
});

export default router;
