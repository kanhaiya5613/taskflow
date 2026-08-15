import TaskCard from './TaskCard.jsx';

export default function Column({
  column,
  allColumns,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onDropTask,
}) {
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/task-id');
    if (taskId) onDropTask(Number(taskId), column.id);
  };

  return (
    <div className="column" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="column-header">
        <h2>{column.name}</h2>
        <span className="column-count">{tasks.length}</span>
      </div>

      <div className="column-tasks">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/task-id', String(task.id))}
          >
            <TaskCard
              task={task}
              columns={allColumns}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMove={onMoveTask}
            />
          </div>
        ))}
        {tasks.length === 0 && <p className="column-empty">No tasks here.</p>}
      </div>

      <button className="add-task-btn" onClick={() => onAddTask(column.id)}>
        + Add task
      </button>
    </div>
  );
}
