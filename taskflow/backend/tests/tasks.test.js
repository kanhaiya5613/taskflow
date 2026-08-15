import './setup.js';
import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from './helpers/http.js';
import db from '../src/db/index.js';
import {
  getTaskCountsPerColumn,
  getTasksByPriority,
} from '../src/db/queries.js';

let app;
let boardId, todoId, inProgressId, doneId;

before(async () => {
  ({ default: app } = await import('../src/app.js'));
});

// Reset and re-seed a tiny fixture before every test so tests don't leak state.
beforeEach(() => {
  db.exec('DELETE FROM tasks; DELETE FROM columns; DELETE FROM boards;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('tasks','columns','boards');");

  boardId = db.prepare('INSERT INTO boards (name) VALUES (?)').run('Test Board').lastInsertRowid;
  todoId = db
    .prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)')
    .run(boardId, 'To Do', 0).lastInsertRowid;
  inProgressId = db
    .prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)')
    .run(boardId, 'In Progress', 1).lastInsertRowid;
  doneId = db
    .prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)')
    .run(boardId, 'Done', 2).lastInsertRowid;
});

test('creating a task with no title fails', async () => {
  const res = await request(app, 'POST', '/api/tasks', {
    columnId: todoId,
    title: '   ',
  });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /title/i);

  const res2 = await request(app, 'POST', '/api/tasks', { columnId: todoId });
  assert.equal(res2.status, 400);
});

test('creating a task with a valid title succeeds', async () => {
  const res = await request(app, 'POST', '/api/tasks', {
    columnId: todoId,
    title: 'Write tests',
    priority: 'High',
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Write tests');
  assert.equal(res.body.column_id, todoId);
});

test('moving a task updates its column (status)', async () => {
  const created = await request(app, 'POST', '/api/tasks', {
    columnId: todoId,
    title: 'Move me',
  });
  const taskId = created.body.id;

  const moved = await request(app, 'PATCH', `/api/tasks/${taskId}/move`, {
    columnId: doneId,
  });

  assert.equal(moved.status, 200);
  assert.equal(moved.body.column_id, doneId);

  const stored = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  assert.equal(stored.column_id, doneId);
});

test('moving a task to a nonexistent column fails', async () => {
  const created = await request(app, 'POST', '/api/tasks', {
    columnId: todoId,
    title: 'Stay put',
  });
  const res = await request(app, 'PATCH', `/api/tasks/${created.body.id}/move`, {
    columnId: 999999,
  });
  assert.equal(res.status, 400);
});

test('database layer: task counts per column reflect actual rows', () => {
  db.prepare('INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)').run(
    todoId,
    'Task A',
    'Low'
  );
  db.prepare('INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)').run(
    todoId,
    'Task B',
    'High'
  );
  db.prepare('INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)').run(
    inProgressId,
    'Task C',
    'Medium'
  );

  const counts = getTaskCountsPerColumn(boardId);
  const byName = Object.fromEntries(counts.map((c) => [c.column_name, c.task_count]));

  assert.equal(byName['To Do'], 2);
  assert.equal(byName['In Progress'], 1);
  assert.equal(byName['Done'], 0);
});

test('database layer: tasks by priority returns newest first', () => {
  db.prepare(
    'INSERT INTO tasks (column_id, title, priority, created_at) VALUES (?, ?, ?, ?)'
  ).run(todoId, 'Older high task', 'High', '2026-01-01 10:00:00');
  db.prepare(
    'INSERT INTO tasks (column_id, title, priority, created_at) VALUES (?, ?, ?, ?)'
  ).run(inProgressId, 'Newer high task', 'High', '2026-02-01 10:00:00');
  db.prepare(
    'INSERT INTO tasks (column_id, title, priority, created_at) VALUES (?, ?, ?, ?)'
  ).run(todoId, 'A low task', 'Low', '2026-03-01 10:00:00');

  const highTasks = getTasksByPriority(boardId, 'High');
  assert.equal(highTasks.length, 2);
  assert.equal(highTasks[0].title, 'Newer high task');
  assert.equal(highTasks[1].title, 'Older high task');
});
