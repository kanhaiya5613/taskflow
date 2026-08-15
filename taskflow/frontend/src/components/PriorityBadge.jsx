const STYLES = {
  Low: { bg: '#E8F0EA', fg: '#2F6B44' },
  Medium: { bg: '#FCF0DA', fg: '#946A1D' },
  High: { bg: '#FBE7E5', fg: '#B23B31' },
};

export default function PriorityBadge({ priority }) {
  const style = STYLES[priority] || STYLES.Medium;
  return (
    <span
      className="priority-badge"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {priority}
    </span>
  );
}
