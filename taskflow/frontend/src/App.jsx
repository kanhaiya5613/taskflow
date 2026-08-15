import { useEffect, useState, useMemo, useCallback } from 'react';
import Column from './components/Column.jsx';
import TaskModal from './components/TaskModal.jsx';
import FilterBar from './components/FilterBar.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import { api, ApiError } from './api/client.js';
import './App.css';

const BOARD_ID = 1; // Single-board app; multiple boards are out of scope.

export default function App() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [modalState, setModalState] = useState(null); // { mode: 'create'|'edit', columnId?, task? }

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getBoard(BOARD_ID);
      setBoard(data);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load the board.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const handleAddTask = (columnId) => setModalState({ mode: 'create', columnId });
  const handleEditTask = (task) => setModalState({ mode: 'edit', task });
  const closeModal = () => setModalState(null);

  const handleSubmitTask = async (values) => {
    try {
      if (modalState.mode === 'create') {
        await api.createTask({ columnId: modalState.columnId, ...values });
      } else {
        await api.updateTask(modalState.task.id, values);
      }
      closeModal();
      await loadBoard();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save the task.');
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    try {
      await api.deleteTask(task.id);
      await loadBoard();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete the task.');
    }
  };

  const handleMoveTask = async (task, columnId) => {
    if (task.column_id === columnId) return;
    // Optimistic update so drag-and-drop / dropdown moves feel instant.
    setBoard((prev) => {
      if (!prev) return prev;
      const columns = prev.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== task.id),
      }));
      const target = columns.find((c) => c.id === columnId);
      if (target) target.tasks.push({ ...task, column_id: columnId });
      return { ...prev, columns };
    });
    try {
      await api.moveTask(task.id, columnId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to move the task.');
      await loadBoard(); // roll back to server truth
    }
  };

  const filteredColumns = useMemo(() => {
    if (!board) return [];
    return board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => {
        const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
        const matchesSearch = t.title.toLowerCase().includes(search.trim().toLowerCase());
        return matchesPriority && matchesSearch;
      }),
    }));
  }, [board, priorityFilter, search]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>TaskFlow</h1>
        {board && <span className="board-name">{board.name}</span>}
      </header>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {!loading && board && (
        <FilterBar
          priorityFilter={priorityFilter}
          onChange={setPriorityFilter}
          search={search}
          onSearchChange={setSearch}
        />
      )}

      {loading && <p className="status-text">Loading board…</p>}
      {!loading && !board && !error && <p className="status-text">No board found.</p>}

      {!loading && board && (
        <div className="board">
          {filteredColumns.map((col) => (
            <Column
              key={col.id}
              column={col}
              allColumns={board.columns}
              tasks={col.tasks}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onMoveTask={handleMoveTask}
              onDropTask={handleMoveTask}
            />
          ))}
        </div>
      )}

      {modalState && (
        <TaskModal
          initialTask={modalState.mode === 'edit' ? modalState.task : null}
          onSubmit={handleSubmitTask}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
