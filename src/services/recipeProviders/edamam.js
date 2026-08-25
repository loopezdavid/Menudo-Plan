// Edamam Recipe Search API — catálogo grande y buen filtrado, pero requiere
// App ID + App Key propios (developer.edamam.com) y no da pasos de
// preparación: solo enlaza a la receta original (se respeta linkeando siempre
// a recipe.url, como exigen sus términos de uso).
import { classifyIngredient } from '../../utils/ingredientMatch'
import { mapExternalCategory } from './categoryMap'

const BASE = 'https://api.edamam.com/api/recipes/v2'

function normalizeHit({ recipe }) {
  const servings = recipe.yield || 4
  const ingredients = (recipe.ingredients || []).map((ing) => ({
    ingredientId: null,
    name: ing.food || ing.text,
    quantity: ing.quantity || (ing.weight ? Math.round(ing.weight) : 1),
    unit: ing.measure && ing.measure !== '<unit>' ? ing.measure : ing.weight ? 'g' : 'ud',
    category: classifyIngredient(ing.food || ing.text),
  }))

  return {
    id: `edamam:${encodeURIComponent(recipe.uri.split('_').pop())}`,
    source: 'edamam',
    sourceLabel: 'Edamam',
    sourceUrl: recipe.url,
    name: recipe.label,
    image: recipe.image || null,
    categories: [mapExternalCategory((recipe.dishType || []).join(' '), (recipe.cuisineType || []).join(' '), (recipe.mealType || []).join(' '))],
    time: recipe.totalTime || null,
    difficulty: null,
    servings,
    kcal: recipe.calories ? Math.round(recipe.calories / servings) : null,
    protein: null,
    method: null,
    ingredients,
    steps: null, // Edamam no ofrece instrucciones, solo enlaza a la fuente.
  }
}

export async function searchEdamam(query, appId, appKey) {
  const q = query.trim()
  if (!q || !appId || !appKey) return []

  const params = new URLSearchParams({ type: 'public', q, app_id: appId, app_key: appKey })
  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('App ID / API key de Edamam inválidos.')
    }
    throw new Error(`Edamam ${res.status}`)
  }
  const data = await res.json()
  return (data.hits || []).map(normalizeHit)
}
