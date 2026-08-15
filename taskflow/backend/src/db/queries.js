// All hand-written SQL lives here so it's easy to point a reviewer at it.
import db from './index.js';

export function getBoardWithColumnsAndTasks(boardId) {
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);
  if (!board) return null;

  const columns = db
    .prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC')
    .all(boardId);

  const tasksByColumn = db
    .prepare(
      `SELECT tasks.* FROM tasks
       JOIN columns ON columns.id = tasks.column_id
       WHERE columns.board_id = ?
       ORDER BY tasks.created_at ASC`
    )
    .all(boardId);

  const columnsWithTasks = columns.map((col) => ({
    ...col,
    tasks: tasksByColumn.filter((t) => t.column_id === col.id),
  }));

  return { ...board, columns: columnsWithTasks };
}

// Required query #1: count of tasks per column on a board.
// Uses LEFT JOIN + GROUP BY so empty columns still show a count of 0,
// instead of fetching every row and counting in JS.
export function getTaskCountsPerColumn(boardId) {
  return db
    .prepare(
      `SELECT columns.id AS column_id, columns.name AS column_name, COUNT(tasks.id) AS task_count
       FROM columns
       LEFT JOIN tasks ON tasks.column_id = columns.id
       WHERE columns.board_id = ?
       GROUP BY columns.id
       ORDER BY columns.position ASC`
    )
    .all(boardId);
}

// Required query #2: tasks with a given priority on a board, newest first.
export function getTasksByPriority(boardId, priority) {
  return db
    .prepare(
      `SELECT tasks.* FROM tasks
       JOIN columns ON columns.id = tasks.column_id
       WHERE columns.board_id = ? AND tasks.priority = ?
       ORDER BY tasks.created_at DESC`
    )
    .all(boardId, priority);
}

export function getColumnById(columnId) {
  return db.prepare('SELECT * FROM columns WHERE id = ?').get(columnId);
}

export function getTaskById(taskId) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
}

export function createTask({ columnId, title, description, priority }) {
  const stmt = db.prepare(
    `INSERT INTO tasks (column_id, title, description, priority)
     VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(columnId, title, description ?? null, priority ?? 'Medium');
  return getTaskById(info.lastInsertRowid);
}

export function updateTask(taskId, { title, description, priority }) {
  const existing = getTaskById(taskId);
  if (!existing) return null;

  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, priority = ? WHERE id = ?`
  ).run(
    title ?? existing.title,
    description === undefined ? existing.description : description,
    priority ?? existing.priority,
    taskId
  );
  return getTaskById(taskId);
}

export function moveTask(taskId, columnId) {
  const existing = getTaskById(taskId);
  if (!existing) return null;

  db.prepare('UPDATE tasks SET column_id = ? WHERE id = ?').run(columnId, taskId);
  return getTaskById(taskId);
}

export function deleteTask(taskId) {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  return info.changes > 0;
}
