const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g')

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(DIACRITICS_RE, '')
}

export function filterRecipes(recipes, { query = '', category = null } = {}) {
  const q = normalize(query.trim())
  return recipes.filter((r) => {
    if (category && !r.categories.includes(category)) return false
    if (!q) return true
    const haystack = normalize(
      [r.name, ...r.categories, ...r.ingredients.map((i) => i.ingredientId || i.name || '')].join(' ')
    )
    return haystack.includes(q)
  })
}
