import { useState } from 'react';
import PriorityBadge from './PriorityBadge.jsx';

export default function TaskCard({ task, columns, onEdit, onDelete, onMove }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="task-card">
      <div className="task-card-top">
        <PriorityBadge priority={task.priority} />
        <div className="task-card-menu">
          <button
            className="icon-btn"
            aria-label="Task actions"
            onClick={() => setMenuOpen((v) => !v)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="task-menu" onMouseLeave={() => setMenuOpen(false)}>
              <button
                onClick={() => {
                  onEdit(task);
                  setMenuOpen(false);
                }}
              >
                Edit
              </button>
              <button
                className="danger"
                onClick={() => {
                  onDelete(task);
                  setMenuOpen(false);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="task-title">{task.title}</p>
      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-card-bottom">
        <label className="move-select">
          <span className="sr-only">Move task</span>
          <select
            value={task.column_id}
            onChange={(e) => onMove(task, Number(e.target.value))}
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
