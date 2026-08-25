export default function ProgressBar({ value, total, className = '' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className={`h-2 w-full rounded-full bg-surface-2 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
