export default function FilterBar({ priorityFilter, onChange, search, onSearchChange }) {
  return (
    <div className="filter-bar">
      <label className="field-inline">
        <span>Priority</span>
        <select value={priorityFilter} onChange={(e) => onChange(e.target.value)}>
          <option value="All">All</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </label>

      <input
        className="search-input"
        type="text"
        placeholder="Search tasks by title…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
