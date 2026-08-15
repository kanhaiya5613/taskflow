// Seeds a fresh database with one board, three columns, and a handful of tasks.
// Safe to re-run: it wipes existing rows first.
import db from './index.js';

function seed() {
  const wipe = db.transaction(() => {
    db.exec('DELETE FROM tasks; DELETE FROM columns; DELETE FROM boards;');
    // Reset autoincrement counters so ids start clean on a fresh seed.
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('tasks', 'columns', 'boards');");
  });
  wipe();

  const insertBoard = db.prepare('INSERT INTO boards (name) VALUES (?)');
  const insertColumn = db.prepare(
    'INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)'
  );
  const insertTask = db.prepare(
    `INSERT INTO tasks (column_id, title, description, priority, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  const run = db.transaction(() => {
    const boardId = insertBoard.run('Product Launch').lastInsertRowid;

    const todoId = insertColumn.run(boardId, 'To Do', 0).lastInsertRowid;
    const inProgressId = insertColumn.run(boardId, 'In Progress', 1).lastInsertRowid;
    const doneId = insertColumn.run(boardId, 'Done', 2).lastInsertRowid;

    const tasks = [
      [todoId, 'Write launch announcement', 'Draft the blog post and email copy.', 'High', '2026-08-01 09:00:00'],
      [todoId, 'Set up analytics dashboard', null, 'Medium', '2026-08-02 10:30:00'],
      [todoId, 'Research competitor pricing', 'Quick pass, not exhaustive.', 'Low', '2026-08-03 14:00:00'],
      [inProgressId, 'Build onboarding flow', 'Covers signup through first task created.', 'High', '2026-08-04 08:15:00'],
      [inProgressId, 'Fix mobile nav bug', 'Menu overlaps the logo on small screens.', 'Medium', '2026-08-05 11:45:00'],
      [doneId, 'Choose tech stack', 'React + Express + SQLite.', 'Medium', '2026-07-28 16:00:00'],
      [doneId, 'Design database schema', null, 'High', '2026-07-29 09:30:00'],
    ];

    for (const t of tasks) insertTask.run(...t);
  });
  run();

  console.log('Seed complete.');
}

seed();
