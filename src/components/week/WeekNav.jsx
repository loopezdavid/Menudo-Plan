import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatWeekRange, isCurrentWeek } from '../../utils/date'

export default function WeekNav({ weekKey, onPrev, onNext, onToday }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 mb-4">
      <button
        onClick={onPrev}
        className="h-9 w-9 shrink-0 rounded-full bg-surface border border-border flex items-center justify-center active:scale-90 transition text-text-muted"
        aria-label="Semana anterior"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        onClick={onToday}
        className="flex flex-col items-center min-w-0"
        disabled={isCurrentWeek(weekKey)}
      >
        <span className="text-[15px] font-bold text-text">{formatWeekRange(weekKey)}</span>
        {!isCurrentWeek(weekKey) && (
          <span className="text-[11px] font-semibold text-primary-500">Ir a hoy</span>
        )}
      </button>

      <button
        onClick={onNext}
        className="h-9 w-9 shrink-0 rounded-full bg-surface border border-border flex items-center justify-center active:scale-90 transition text-text-muted"
        aria-label="Semana siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
