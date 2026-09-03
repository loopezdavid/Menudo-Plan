import { Flame, Drumstick } from 'lucide-react'

export default function WeekNutritionSummary({ nutrition, total }) {
  if (!total || !nutrition?.withKcal) return null
  const avgKcal = Math.round(nutrition.kcal / nutrition.withKcal)
  const avgProtein = nutrition.protein ? Math.round(nutrition.protein / nutrition.withKcal) : null
  const coverage = nutrition.withKcal < total

  return (
    <div className="flex items-center gap-2 mb-4 rounded-2xl bg-surface border border-border px-4 py-3">
      <span className="h-9 w-9 shrink-0 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
        <Flame size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-text">
          ~{Math.round(nutrition.kcal)} kcal en la semana
          {avgProtein ? <span className="text-text-muted font-normal"> · ~{Math.round(nutrition.protein)} g proteína</span> : null}
        </p>
        <p className="text-[11px] text-text-muted">
          Media por plato: {avgKcal} kcal{avgProtein ? ` · ${avgProtein} g proteína` : ''}
          {coverage ? ` (calculado sobre ${nutrition.withKcal}/${total} platos con datos)` : ''}
        </p>
      </div>
      <Drumstick size={15} className="text-text-soft shrink-0" />
    </div>
  )
}
