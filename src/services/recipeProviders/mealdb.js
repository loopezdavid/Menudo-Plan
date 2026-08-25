// TheMealDB — API pública y gratuita, sin registro (usa la clave de prueba "1").
// https://www.themealdb.com/api.php
import { classifyIngredient, parseMeasure } from '../../utils/ingredientMatch'
import { mapExternalCategory } from './categoryMap'

const BASE = 'https://www.themealdb.com/api/json/v1/1'

function normalizeMeal(meal) {
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim()
    if (!name) continue
    const { quantity, unit } = parseMeasure(meal[`strMeasure${i}`])
    ingredients.push({
      ingredientId: null,
      name,
      quantity,
      unit,
      category: classifyIngredient(name),
    })
  }

  const steps = (meal.strInstructions || '')
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    id: `mealdb:${meal.idMeal}`,
    source: 'mealdb',
    sourceLabel: 'TheMealDB',
    sourceUrl: `https://www.themealdb.com/meal/${meal.idMeal}`,
    name: meal.strMeal,
    image: meal.strMealThumb ? `${meal.strMealThumb}/medium` : null,
    categories: [mapExternalCategory(meal.strCategory, meal.strArea)],
    time: null,
    difficulty: null,
    servings: 4,
    kcal: null,
    protein: null,
    method: null,
    ingredients,
    steps: steps.length ? steps : null,
  }
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TheMealDB ${res.status}`)
  return res.json()
}

async function searchByName(term) {
  const data = await fetchJson(`${BASE}/search.php?s=${encodeURIComponent(term)}`)
  return data.meals || null
}

async function searchByIngredient(term) {
  const data = await fetchJson(`${BASE}/filter.php?i=${encodeURIComponent(term)}`)
  if (!data.meals) return []
  const ids = data.meals.slice(0, 8).map((m) => m.idMeal)
  const full = await Promise.all(
    ids.map((id) => fetchJson(`${BASE}/lookup.php?i=${id}`).then((r) => r.meals?.[0]).catch(() => null))
  )
  return full.filter(Boolean)
}

export async function searchMealDb(query) {
  const q = query.trim()
  if (!q) return []

  // El buscador de TheMealDB compara la frase completa contra el nombre del
  // plato (sin tokenizar), así que "pasta carbonara" no encuentra "Spaghetti
  // alla Carbonara". Si la frase completa no da resultados, probamos palabra
  // a palabra (de la más específica/última a la primera) y por último por
  // ingrediente con la primera palabra.
  let meals = await searchByName(q)
  if (!meals) {
    const words = q.split(/\s+/).filter((w) => w.length > 2)
    for (let i = words.length - 1; i >= 0 && !meals; i--) {
      meals = await searchByName(words[i])
    }
    if (!meals && words.length) {
      meals = await searchByIngredient(words[0])
    }
  }

  return (meals || []).slice(0, 8).map(normalizeMeal)
}
