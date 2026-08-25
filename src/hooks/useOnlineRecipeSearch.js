import { useCallback, useState } from 'react'
import { useStore } from '../store/useStore'
import { searchOnlineRecipes } from '../services/recipeSearch'

// Búsqueda online explícita (botón), no en cada tecla: TheMealDB es gratis
// pero Spoonacular/Edamam tienen cuota diaria limitada por API key.
export function useOnlineRecipeSearch() {
  const apiKeys = useStore((s) => s.settings.apiKeys)
  const [results, setResults] = useState([])
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const search = useCallback(
    async (query) => {
      const q = query.trim()
      if (!q) return
      setLoading(true)
      setHasSearched(true)
      try {
        const { results: found, errors: foundErrors } = await searchOnlineRecipes(q, apiKeys)
        setResults(found)
        setErrors(foundErrors)
      } finally {
        setLoading(false)
      }
    },
    [apiKeys]
  )

  const reset = useCallback(() => {
    setResults([])
    setErrors([])
    setHasSearched(false)
  }, [])

  return { results, errors, loading, hasSearched, search, reset }
}
