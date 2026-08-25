import { searchMealDb } from './recipeProviders/mealdb'
import { searchSpoonacular } from './recipeProviders/spoonacular'
import { searchEdamam } from './recipeProviders/edamam'

// Busca en los tres bancos de recetas en paralelo. TheMealDB no necesita
// clave; Spoonacular/Edamam se omiten en silencio si el usuario no ha
// configurado su API key en Ajustes. Un proveedor que falle no tumba a los
// demás: se agrupan avisos en `errors` para poder mostrarlos aparte.
export async function searchOnlineRecipes(query, apiKeys = {}) {
  const jobs = [
    { source: 'mealdb', run: () => searchMealDb(query) },
  ]

  if (apiKeys.spoonacular) {
    jobs.push({ source: 'spoonacular', run: () => searchSpoonacular(query, apiKeys.spoonacular) })
  }
  if (apiKeys.edamamAppId && apiKeys.edamamAppKey) {
    jobs.push({ source: 'edamam', run: () => searchEdamam(query, apiKeys.edamamAppId, apiKeys.edamamAppKey) })
  }

  const settled = await Promise.allSettled(jobs.map((j) => j.run()))

  const results = []
  const errors = []
  settled.forEach((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      results.push(...outcome.value)
    } else {
      errors.push({ source: jobs[i].source, message: outcome.reason?.message || 'Error desconocido' })
    }
  })

  return { results, errors }
}
