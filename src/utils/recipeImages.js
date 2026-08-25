// Fotos de cada receta (descargadas una sola vez con scripts/fetch-recipe-images.mjs
// desde Wikimedia Commons, contenido de reuso libre). Vite las empaqueta como
// assets estáticos; aquí solo montamos el mapa id -> url.
const modules = import.meta.glob('../assets/recipes/*.{webp,jpg,jpeg,png}', { eager: true, import: 'default' })

const IMAGES = {}
for (const [filePath, url] of Object.entries(modules)) {
  const id = filePath.split('/').pop().replace(/\.[^.]+$/, '')
  IMAGES[id] = url
}

export function getRecipeImage(recipeId) {
  return IMAGES[recipeId] || null
}
