import { AlertTriangle } from 'lucide-react'
import { CATEGORY_TAGS } from '../../data/categoryTags'

const HIGHLIGHT_TAGS = ['pescado', 'pollo', 'carne', 'legumbres']
const MAIN_DISH_TAGS = ['pescado', 'marisco', 'pollo', 'carne', 'pasta', 'arroz', 'legumbres']

export default function WeekStats({ counts, total }) {
  if (!total) return null
  const repeatedWarning = Object.entries(counts).find(
    ([tag, n]) => MAIN_DISH_TAGS.includes(tag) && n >= 6
  )

  return (
    <div className="mb-5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        {HIGHLIGHT_TAGS.map((tag) => (
          <div
            key={tag}
            className="shrink-0 flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1.5"
          >
            <span className="text-[12px] font-semibold text-text">{counts[tag] || 0}</span>
            <span className="text-[11px] text-text-muted">{CATEGORY_TAGS[tag]?.label}</span>
          </div>
        ))}
      </div>
      {repeatedWarning && (
        <div className="flex items-center gap-2 mt-2.5 rounded-xl bg-amber-50 text-amber-700 px-3 py-2 text-[12px]">
          <AlertTriangle size={14} className="shrink-0" />
          <span>
            Hay muchos platos de {CATEGORY_TAGS[repeatedWarning[0]]?.label.toLowerCase()} esta semana ({repeatedWarning[1]}). Prueba a variar un poco más.
          </span>
        </div>
      )}
    </div>
  )
}
