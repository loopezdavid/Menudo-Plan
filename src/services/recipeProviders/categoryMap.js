// Traduce la categoría/cocina que devuelve cada API externa a una de las
// etiquetas que ya usa el recetario local (src/data/categoryTags.js), para
// que los chips de color funcionen igual en recetas propias y externas.
// 'internacional' es el comodín cuando no hay una traducción clara.

const RULES = [
  [/chicken|pollo|poultry/i, 'pollo'],
  [/beef|pork|lamb|carne|meat|goat/i, 'carne'],
  [/seafood|shrimp|marisco|prawn/i, 'marisco'],
  [/fish|pescado|salmon|tuna|cod/i, 'pescado'],
  [/pasta|noodle/i, 'pasta'],
  [/rice\b|arroz|risotto/i, 'arroz'],
  [/vegetarian|vegan|legum|bean|lentil/i, 'legumbres'],
  [/breakfast|dessert|desayuno|pancake|brunch/i, 'desayunos'],
  [/starter|side|soup|salad|primeros|appetizer/i, 'primeros'],
]

export function mapExternalCategory(...raw) {
  const text = raw.filter(Boolean).join(' ')
  for (const [regex, tag] of RULES) {
    if (regex.test(text)) return tag
  }
  return 'internacional'
}
