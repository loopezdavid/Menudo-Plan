import CalendarCell from './CalendarCell'
import { DAYS, SLOTS } from '../../data/initialWeekPlan'

const BAND_LABELS = {
  breakfast: null,
  lunch1: 'Comida',
  lunch2: null,
  dinner1: 'Cena',
  dinner2: null,
}

const BAND_BG = {
  breakfast: 'bg-cat-breakfast-bg/25',
  lunch1: 'bg-primary-50/40',
  lunch2: 'bg-primary-50/40',
  dinner1: 'bg-cat-intl-bg/25',
  dinner2: 'bg-cat-intl-bg/25',
}

export default function CalendarGrid({ weekStart, plan, sameDate, onPick, onView, onRemove }) {
  return (
    <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 pb-2">
      <div className="min-w-[860px] md:min-w-0">
        {/* Cabecera de días */}
        <div className="grid sticky top-0 z-10 bg-bg/95 backdrop-blur-sm pb-2" style={{ gridTemplateColumns: '68px repeat(7, minmax(0, 1fr))' }}>
          <div />
          {DAYS.map((day, i) => {
            const date = new Date(weekStart)
            date.setDate(date.getDate() + i)
            const today = sameDate(date, new Date())
            return (
              <div key={day.key} className="flex flex-col items-center px-1">
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${today ? 'text-primary-500' : 'text-text-muted'}`}>
                  {day.label.slice(0, 3)}
                </span>
                <span
                  className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                    today ? 'bg-primary-500 text-white shadow-sm' : 'text-text'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
            )
          })}
        </div>

        {/* Filas por franja */}
        <div className="flex flex-col gap-1.5">
          {SLOTS.map((slot) => (
            <div key={slot.key} className={`grid gap-1.5 rounded-2xl p-1.5 ${BAND_BG[slot.key]}`} style={{ gridTemplateColumns: '68px repeat(7, minmax(0, 1fr))' }}>
              <div className="flex flex-col items-start justify-center pl-1 pr-1">
                {BAND_LABELS[slot.key] && (
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-text-soft leading-tight">
                    {BAND_LABELS[slot.key]}
                  </span>
                )}
                <span className="text-[11px] font-semibold text-text-muted leading-tight">{slot.label}</span>
              </div>
              {DAYS.map((day) => (
                <CalendarCell
                  key={`${day.key}-${slot.key}`}
                  dayKey={day.key}
                  slotKey={slot.key}
                  recipeId={plan[day.key]?.[slot.key] || null}
                  onPick={onPick}
                  onView={onView}
                  onRemove={onRemove}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
