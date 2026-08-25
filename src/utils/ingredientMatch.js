// Clasifica un ingrediente en texto libre (español o inglés, viene de recetas
// externas) dentro de una de nuestras categorías de la lista de la compra.
// No intenta mapear a un ingredientId canónico (eso solo existe para el
// recetario local) — solo decide en qué sección de la compra debe agruparse.

const RULES = [
  // Compuestos como "vegetable oil" o "chicken stock" deben ganar a la
  // palabra genérica que contienen (vegetable→verdura, chicken→carne), así
  // que las reglas de salsas/condimentos van primero.
  [/\boil\b|aceite|\bsalt\b|\bsal\b|vinegar|vinagre|\bsauce\b|salsa|spice|especia|\bherb\b|hierba|honey|miel|sugar|az[uú]car|mustard|mostaza|paprika|piment[oó]n|cumin|comino|curry|cinnamon|canela|sriracha|soy sauce|soja|stock|caldo|broth|wine|vino/i, 'condiments'],
  [/chicken|pollo|turkey|pavo|duck|pato/i, 'meat'],
  [/\bbeef\b|ternera|\bcarne\b|pork|cerdo|lamb|cordero|bacon|panceta|jam[oó]n|sausage|chorizo|salchich|mince\b|steak/i, 'meat'],
  [/salmon|salm[oó]n|tuna|at[uú]n|cod|bacalao|anchov|fish\b|pescado|shrimp|prawn|gamba|clam|almeja|mussel|mejill[oó]n|seafood|marisco|hake|merluza|squid|calamar|octopus|pulpo/i, 'fish'],
  [/\bmilk\b|leche|cheese|queso|\begg\b|huevo|yogurt|yogur|cream\b|nata|butter|mantequilla|mozzarella|parmesan|feta|cheddar/i, 'dairy'],
  [/\brice\b|arroz|pasta|noodle|fideo|spaghetti|macaroni|penne|\bflour\b|harina|\bbread\b|\bpan\b|oat|avena|cereal|tortilla|couscous|cusc[uú]s|quinoa/i, 'grains'],
  [/\bbean\b|frijol|jud[ií]a|lentil|lenteja|chickpea|garbanzo|legum/i, 'legumes'],
  [/tomato|tomate|onion|cebolla|garlic|\bajo\b|potato|patata|carrot|zanahoria|pepper\b.*bell|bell.*pepper|pimiento|lettuce|lechuga|spinach|espinaca|cucumber|pepino|avocado|aguacate|lemon|lim[oó]n|lime|lima\b|apple|manzana|banana|pl[aá]tano|mango|parsley|perejil|cilantro|coriander|mushroom|champi[nñ][oó]n|seta|zucchini|courgette|calabac[ií]n|eggplant|aubergine|berenjena|ginger|jengibre|cabbage|\bcol\b|orange|naranja|celery|apio|broccoli|br[oó]coli|leek|puerro|corn|ma[ií]z|squash|calabaza|vegetable|verdura|fruit|fruta/i, 'produce'],
]

export function classifyIngredient(rawName) {
  const name = (rawName || '').toLowerCase()
  for (const [regex, category] of RULES) {
    if (regex.test(name)) return category
  }
  return 'other'
}

// Convierte una medida en texto libre ("200g", "1 cup", "1/2 tsp", "to taste")
// en { quantity, unit }. Aproximado por naturaleza: viene de fuentes externas
// sin estructura fija.
export function parseMeasure(measure) {
  const text = (measure || '').trim()
  if (!text) return { quantity: 1, unit: 'ud' }

  const match = text.match(/^([\d½⅓⅔¼¾]+(?:\s+\d+\/\d+)?(?:\/\d+)?(?:\.\d+)?)\s*(.*)$/)
  if (!match || !match[1]) return { quantity: 1, unit: text || 'ud' }

  const numPart = match[1]
  const unit = match[2].trim() || 'ud'
  const quantity = parseFraction(numPart)
  if (!quantity || Number.isNaN(quantity)) return { quantity: 1, unit: text }
  return { quantity, unit }
}

const UNICODE_FRACTIONS = { '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75 }

function parseFraction(str) {
  const s = str.trim()
  if (UNICODE_FRACTIONS[s] !== undefined) return UNICODE_FRACTIONS[s]
  if (s.includes('/')) {
    const parts = s.split(/\s+/)
    let total = 0
    for (const part of parts) {
      if (part.includes('/')) {
        const [n, d] = part.split('/').map(Number)
        if (d) total += n / d
      } else {
        total += Number(part) || 0
      }
    }
    return total || null
  }
  const n = Number(s)
  return Number.isNaN(n) ? null : n
}
