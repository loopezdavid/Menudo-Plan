import { getIngredient, CATEGORIES } from '../data/ingredients'
import { getRecipe } from '../data/recipes'
import { SLOTS } from '../data/initialWeekPlan'

// Combina calendario semanal + productos manuales + artículos fijos de casa
// en una lista de la compra agrupada por categoría, sumando cantidades cuando
// varias recetas (o un producto manual) comparten el mismo ingrediente y unidad.
// `lookupRecipe` es inyectable para poder resolver también recetas externas
// (bancos online) cacheadas en el store, sin acoplar este módulo a Zustand.
export function calculateShoppingList({
  weekPlan,
  manualItems = [],
  fixedHomeItems = [],
  checked = {},
  peopleCount = 2,
  lookupRecipe = getRecipe,
}) {
  const scale = peopleCount / 2
  const lines = new Map() // key: `${ingredientId}__${unit}` -> line

  function addLine({ ingredientId, name, quantity, unit, category: categoryOverride, sourceRecipeIds = [] }) {
    const info = ingredientId ? getIngredient(ingredientId) : null
    const category = info?.category || categoryOverride || 'other'
    const displayName = info?.name || name
    const key = `${ingredientId || `manual:${name.toLowerCase()}`}__${unit}`

    if (lines.has(key)) {
      const line = lines.get(key)
      line.quantity += quantity
      for (const rid of sourceRecipeIds) {
        if (!line.sourceRecipeIds.includes(rid)) line.sourceRecipeIds.push(rid)
      }
    } else {
      lines.set(key, {
        id: key,
        ingredientId: ingredientId || null,
        name: displayName,
        quantity,
        unit,
        category,
        sourceRecipeIds: [...sourceRecipeIds],
        checked: !!checked[key],
      })
    }
  }

  // 1. Recorrer el calendario y sumar ingredientes de cada receta seleccionada
  if (weekPlan) {
    for (const dayKey of Object.keys(weekPlan)) {
      const day = weekPlan[dayKey]
      for (const slot of SLOTS) {
        const recipeId = day?.[slot.key]
        if (!recipeId) continue
        const recipe = lookupRecipe(recipeId)
        if (!recipe) continue
        for (const item of recipe.ingredients) {
          addLine({
            ingredientId: item.ingredientId,
            name: item.name,
            category: item.category,
            quantity: item.quantity * scale,
            unit: item.unit,
            sourceRecipeIds: [recipe.id],
          })
        }
      }
    }
  }

  // 2. Productos manuales de la semana
  for (const item of manualItems) {
    addLine({
      ingredientId: item.ingredientId || null,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    })
  }

  // 3. Artículos fijos de casa (se repiten cada semana)
  for (const item of fixedHomeItems) {
    addLine({
      ingredientId: item.ingredientId || null,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    })
  }

  // 4. Agrupar por categoría
  const grouped = {}
  for (const catId of Object.keys(CATEGORIES)) grouped[catId] = []

  for (const line of lines.values()) {
    line.quantity = Math.round(line.quantity * 100) / 100
    grouped[line.category]?.push(line)
  }

  for (const catId of Object.keys(grouped)) {
    grouped[catId].sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1
      return a.name.localeCompare(b.name, 'es')
    })
  }

  const allLines = Array.from(lines.values())
  const total = allLines.length
  const checkedCount = allLines.filter((l) => l.checked).length

  const categories = Object.entries(CATEGORIES)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([id, meta]) => ({ id, ...meta, items: grouped[id] }))
    .filter((c) => c.items.length > 0)

  return { categories, total, checkedCount }
}
