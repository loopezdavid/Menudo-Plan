import { getIngredient } from '../data/ingredients'
import { CATEGORY_TAGS, METHOD_LABELS } from '../data/categoryTags'
import { DAYS, SLOTS } from '../data/initialWeekPlan'
import { formatWeekRange } from './date'
import { getRecipeImage } from './recipeImages'
import { getAnyRecipe } from './recipeLookup'

function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function formatQty(qty, unit) {
  const rounded = Math.round(qty * 10) / 10
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} ${unit}`
}

const DOC_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Inter, Roboto, sans-serif; color: #241f18; margin: 0; padding: 32px 40px; background: #fff; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 17px; margin: 0 0 2px; }
  .subtitle { color: #6f6b5f; font-size: 13px; margin-bottom: 20px; }
  .tag { display: inline-block; font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: #eef6f0; color: #255a41; margin-right: 4px; }
  .meta { display: flex; gap: 18px; margin: 10px 0 16px; font-size: 12.5px; color: #514d43; }
  .meta b { color: #241f18; }
  table.week { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 11.5px; }
  table.week th, table.week td { border: 1px solid #e5e1d4; padding: 6px 6px; text-align: left; vertical-align: top; }
  table.week th { background: #f7f5ee; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.03em; color: #6f6b5f; }
  table.week td { font-size: 11px; }
  .recipe { page-break-inside: avoid; border-top: 2px solid #241f18; padding-top: 14px; margin-top: 26px; }
  .recipe:first-of-type { margin-top: 0; }
  .recipe img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px; margin: 10px 0 4px; }
  ul.ingredients { columns: 2; column-gap: 24px; margin: 8px 0 14px; padding-left: 18px; font-size: 12.5px; }
  ul.ingredients li { break-inside: avoid; margin-bottom: 3px; }
  ol.steps { margin: 0; padding-left: 20px; font-size: 12.5px; line-height: 1.55; }
  ol.steps li { margin-bottom: 6px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #514d43; margin: 12px 0 4px; }
  @page { margin: 16mm; }
`

function recipeHtml(recipe, servings) {
  const scale = servings / (recipe.servings || 4)
  const tags = recipe.categories.map((t) => `<span class="tag">${esc(CATEGORY_TAGS[t]?.label || t)}</span>`).join('')
  const ingredients = recipe.ingredients
    .map((item) => {
      const label = item.ingredientId ? getIngredient(item.ingredientId)?.name : item.name
      return `<li>${esc(label || item.name || item.ingredientId)} — <b>${formatQty(item.quantity * scale, item.unit)}</b></li>`
    })
    .join('')

  const stepsHtml = recipe.steps?.length
    ? `<ol class="steps">${recipe.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`
    : recipe.sourceUrl
      ? `<p class="subtitle">Esta receta viene de ${esc(recipe.sourceLabel || 'una fuente externa')} y no incluye pasos aquí. Puedes verlos en el enlace original: <a href="${esc(recipe.sourceUrl)}">${esc(recipe.sourceUrl)}</a></p>`
      : ''

  const rawImage = recipe.image || getRecipeImage(recipe.id)
  const image = rawImage ? (/^https?:\/\//.test(rawImage) ? rawImage : new URL(rawImage, window.location.href).href) : null

  const metaParts = [
    recipe.time ? `<span><b>${recipe.time}</b> min</span>` : '',
    recipe.difficulty ? `<span><b>${recipe.difficulty}</b></span>` : '',
    recipe.kcal ? `<span><b>${recipe.kcal}</b> kcal/pers.</span>` : '',
    recipe.protein ? `<span><b>${recipe.protein}</b> g proteína</span>` : '',
    `<span>Para <b>${servings}</b> ${servings === 1 ? 'persona' : 'personas'}</span>`,
    recipe.method ? `<span>${esc(METHOD_LABELS[recipe.method] || recipe.method)}</span>` : '',
  ].filter(Boolean)

  return `
    <div class="recipe">
      <div>${tags}</div>
      <h2>${esc(recipe.name)}</h2>
      ${image ? `<img src="${esc(image)}" alt="">` : ''}
      <div class="meta">${metaParts.join('')}</div>
      <p class="section-title">Ingredientes</p>
      <ul class="ingredients">${ingredients}</ul>
      <p class="section-title">Preparación</p>
      ${stepsHtml}
    </div>
  `
}

function openAndPrint(title, bodyHtml) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${DOC_STYLES}</style></head><body>${bodyHtml}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
  }, 350)
}

export function printRecipe(recipeId, servings) {
  const recipe = getAnyRecipe(recipeId)
  if (!recipe) return
  const body = `<h1>${esc(recipe.name)}</h1><p class="subtitle">Ficha de receta</p>${recipeHtml(recipe, servings)}`
  openAndPrint(recipe.name, body)
}

export function printWeek({ weekKey, plan, peopleCount = 2 }) {
  const rows = SLOTS.map((slot) => {
    const cells = DAYS.map((day) => {
      const recipeId = plan[day.key]?.[slot.key]
      const recipe = recipeId ? getAnyRecipe(recipeId) : null
      return `<td>${recipe ? esc(recipe.name) : '—'}</td>`
    }).join('')
    return `<tr><th>${esc(slot.group ? `${slot.group} · ${slot.label}` : slot.label)}</th>${cells}</tr>`
  }).join('')

  const header = `<tr><th></th>${DAYS.map((d) => `<th>${esc(d.label)}</th>`).join('')}</tr>`

  const usedIds = []
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      const recipeId = plan[day.key]?.[slot.key]
      if (recipeId && !usedIds.includes(recipeId)) usedIds.push(recipeId)
    }
  }
  const recipesHtml = usedIds
    .map((id) => getAnyRecipe(id))
    .filter(Boolean)
    .map((r) => recipeHtml(r, peopleCount))
    .join('')

  const body = `
    <h1>Menú semanal</h1>
    <p class="subtitle">Semana del ${esc(formatWeekRange(weekKey))} · ${peopleCount} ${peopleCount === 1 ? 'persona' : 'personas'}</p>
    <table class="week">${header}${rows}</table>
    ${recipesHtml || '<p class="subtitle">No hay platos asignados esta semana.</p>'}
  `
  openAndPrint('Menú semanal', body)
}
