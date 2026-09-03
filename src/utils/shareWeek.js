import { DAYS, SLOTS } from '../data/initialWeekPlan'
import { formatWeekRange } from './date'
import { getAnyRecipe } from './recipeLookup'

const SLOT_LABELS = Object.fromEntries(SLOTS.map((s) => [s.key, s.group ? `${s.group} · ${s.label}` : s.label]))

export function buildWeekShareText(weekKey, plan) {
  const lines = DAYS.map((day) => {
    const dayPlan = plan[day.key] || {}
    const mealLines = SLOTS.map((slot) => {
      const recipeId = dayPlan[slot.key]
      if (!recipeId) return null
      const recipe = getAnyRecipe(recipeId)
      if (!recipe) return null
      return `  · ${SLOT_LABELS[slot.key]}: ${recipe.name}`
    }).filter(Boolean)
    if (!mealLines.length) return `${day.label}: —`
    return `${day.label}:\n${mealLines.join('\n')}`
  })

  return `🍽️ Menú semanal (${formatWeekRange(weekKey)})\n\n${lines.join('\n\n')}`
}

export async function shareOrCopyText(title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
      // sigue al fallback si el share falla por otra razón
    }
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return 'copied'
  }
  return 'unsupported'
}
