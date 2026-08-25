import { useState } from 'react'
import { Check } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { DAYS, SLOTS } from '../../data/initialWeekPlan'
import { useStore } from '../../store/useStore'
import { formatWeekRange } from '../../utils/date'
import { getAnyRecipe } from '../../utils/recipeLookup'

export default function AddToCalendarSheet({ open, onClose, recipeId }) {
  const [dayKey, setDayKey] = useState('monday')
  const activeWeekKey = useStore((s) => s.activeWeekKey)
  const weekPlan = useStore((s) => s.weekPlans[activeWeekKey])
  const setMeal = useStore((s) => s.setMeal)
  const recipe = getAnyRecipe(recipeId)
  if (!recipe) return null

  function handlePick(slotKey) {
    setMeal(activeWeekKey, dayKey, slotKey, recipeId)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Añadir al calendario">
      <p className="text-sm text-text-muted -mt-1 mb-3">
        {recipe.name} · semana del {formatWeekRange(activeWeekKey)}
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-5 px-5">
        {DAYS.map((d) => (
          <button
            key={d.key}
            onClick={() => setDayKey(d.key)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
              dayKey === d.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-surface-2 text-text-muted'
            }`}
          >
            {d.label.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 pb-4">
        {SLOTS.map((slot) => {
          const current = weekPlan?.[dayKey]?.[slot.key]
          const currentRecipe = current ? getAnyRecipe(current) : null
          return (
            <button
              key={slot.key}
              onClick={() => handlePick(slot.key)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5 text-left active:scale-[0.98] transition"
            >
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-text-soft">
                  {slot.group ? `${slot.group} · ${slot.label}` : slot.label}
                </p>
                <p className="text-sm text-text-muted truncate">
                  {currentRecipe ? currentRecipe.name : 'Hueco vacío'}
                </p>
              </div>
              <span className="shrink-0 h-7 w-7 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center">
                <Check size={15} />
              </span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
