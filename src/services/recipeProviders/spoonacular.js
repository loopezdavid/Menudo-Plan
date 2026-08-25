// Spoonacular — catálogo muy grande con datos nutricionales, pero requiere
// una API key gratuita propia (spoonacular.com/food-api/console#Profile).
// El plan gratis limita a 150 puntos/día; cada búsqueda con información e
// nutrientes cuesta varios puntos, así que solo se llama cuando el usuario
// lo pide explícitamente (ver src/services/recipeSearch.js).
import { classifyIngredient } from '../../utils/ingredientMatch'
import { mapExternalCategory } from './categoryMap'

const BASE = 'https://api.spoonacular.com/recipes/complexSearch'

function normalizeResult(r) {
  const ingredients = (r.extendedIngredients || []).map((ing) => ({
    ingredientId: null,
    name: ing.name || ing.original,
    quantity: ing.amount || 1,
    unit: ing.unit || 'ud',
    category: classifyIngredient(ing.name || ing.original),
  }))

  const steps = (r.analyzedInstructions?.[0]?.steps || []).map((s) => s.step).filter(Boolean)

  const nutrients = r.nutrition?.nutrients || []
  const kcal = nutrients.find((n) => n.name === 'Calories')?.amount ?? null
  const protein = nutrients.find((n) => n.name === 'Protein')?.amount ?? null

  return {
    id: `spoonacular:${r.id}`,
    source: 'spoonacular',
    sourceLabel: 'Spoonacular',
    sourceUrl: r.sourceUrl || `https://spoonacular.com/recipes/${(r.title || '').replace(/\s+/g, '-')}-${r.id}`,
    name: r.title,
    image: r.image || null,
    categories: [mapExternalCategory((r.dishTypes || []).join(' '), (r.cuisines || []).join(' '))],
    time: r.readyInMinutes || null,
    difficulty: null,
    servings: r.servings || 4,
    kcal: kcal ? Math.round(kcal) : null,
    protein: protein ? Math.round(protein) : null,
    method: null,
    ingredients,
    steps: steps.length ? steps : null,
  }
}

export async function searchSpoonacular(query, apiKey) {
  const q = query.trim()
  if (!q || !apiKey) return []

  const params = new URLSearchParams({
    apiKey,
    query: q,
    number: '8',
    addRecipeInformation: 'true',
    addNutrition: 'true',
    fillIngredients: 'true',
  })

  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) {
    if (res.status === 401 || res.status === 402) {
      throw new Error('API key de Spoonacular inválida o sin cuota disponible.')
    }
    throw new Error(`Spoonacular ${res.status}`)
  }
  const data = await res.json()
  return (data.results || []).map(normalizeResult)
}
