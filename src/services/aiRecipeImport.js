// Importa una receta desde texto libre, una URL o una foto usando el motor
// de IA elegido en Ajustes (bring-your-own-key: la clave nunca sale de este
// dispositivo salvo hacia la API del proveedor correspondiente).
import { classifyIngredient } from '../utils/ingredientMatch'
import { mapExternalCategory } from './recipeProviders/categoryMap'
import { DAYS, SLOTS } from '../data/initialWeekPlan'

export const AI_ENGINES = {
  claude: { label: 'Claude', loader: () => import('./aiProviders/claude') },
  gemini: { label: 'Gemini', loader: () => import('./aiProviders/gemini') },
  mistral: { label: 'Mistral', loader: () => import('./aiProviders/mistral') },
  openrouter: { label: 'OpenRouter', loader: () => import('./aiProviders/openrouter') },
}

const PROMPT = `Tu tarea es conseguir una receta de cocina completa y utilizable a partir del contenido que te paso a continuación (puede ser el texto de una página web, una foto de una receta, o solo el nombre de un plato escrito por el usuario).

Reglas:
- Si el contenido ya describe una receta (tiene ingredientes y/o pasos), extráela tal cual — no inventes ni cambies cantidades ni pasos que ya estén.
- Si el contenido es solo el nombre de un plato o una descripción corta sin ingredientes ni pasos (p.ej. "tortilla de patatas", "curry de garbanzos", "pollo al ajillo"), NO respondas found=false — en su lugar, genera tú una receta completa y típica para ese plato: ingredientes con cantidades razonables para 4 personas y pasos de preparación claros.
- Responde found=false únicamente si el contenido no tiene relación alguna con un plato o receta de cocina reconocible (p.ej. es un texto sobre otro tema, una foto sin comida, o está vacío/ilegible).
- Mantén el idioma del contenido original (no traduzcas). Si solo te dan el nombre de un plato sin más contexto de idioma, responde en español.
- Cada ingrediente debe llevar cantidad numérica y unidad (g, ml, ud, cucharada, diente, etc.) por separado del nombre — si el original dice "al gusto" o no da cantidad, usa quantity=1 y unit con esa aclaración.
- "steps" son los pasos de preparación, uno por elemento, sin numerarlos tú (ya se numeran en la app).
- servings/timeMinutes: usa valores típicos razonables si no aparecen y has tenido que generar la receta; si extraes una receta ya existente y no los da, dejalos null. imageUrl: null salvo que el contenido incluya de verdad una URL de foto del plato.`

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function normalize(extracted, { sourceUrl = null } = {}) {
  if (!extracted?.found) {
    throw new Error('No he encontrado ninguna receta en ese contenido. Prueba con otro texto, otra URL o una foto más clara.')
  }

  const ingredients = (extracted.ingredients || []).map((ing) => ({
    ingredientId: null,
    name: ing.name,
    quantity: ing.quantity || 1,
    unit: ing.unit || 'ud',
    category: classifyIngredient(ing.name),
  }))

  return {
    id: `ai:${uid()}`,
    source: 'ai',
    sourceLabel: 'Importado con IA',
    sourceUrl,
    name: extracted.name,
    image: extracted.imageUrl || null,
    categories: [mapExternalCategory(extracted.category || '')],
    time: extracted.timeMinutes || null,
    difficulty: null,
    servings: extracted.servings || 4,
    kcal: null,
    protein: null,
    method: null,
    ingredients,
    steps: extracted.steps?.length ? extracted.steps : null,
  }
}

const ENGINE_KEY_FIELDS = {
  claude: { key: 'anthropic', model: null },
  gemini: { key: 'gemini', model: 'geminiModel' },
  mistral: { key: 'mistral', model: 'mistralModel' },
  openrouter: { key: 'openrouter', model: 'openrouterModel' },
}

// Deriva {engine, apiKey, model} a partir de settings.aiEngine + settings.apiKeys.
export function getAiConfig(settings) {
  const engine = settings.aiEngine || 'claude'
  const fields = ENGINE_KEY_FIELDS[engine] || ENGINE_KEY_FIELDS.claude
  return {
    engine,
    apiKey: settings.apiKeys?.[fields.key] || '',
    model: fields.model ? settings.apiKeys?.[fields.model] || '' : null,
  }
}

async function callAI({ engine, apiKey, model }, { bodyText, image }) {
  const def = AI_ENGINES[engine]
  if (!def) throw new Error('Motor de IA no reconocido — elige uno en Ajustes.')
  const mod = await def.loader()
  return mod.extract({ instructionText: PROMPT, bodyText, image, apiKey, model })
}

export async function extractRecipeFromText(text, aiConfig) {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Pega el texto de la receta primero.')
  const extracted = await callAI(aiConfig, { bodyText: trimmed.slice(0, 20000) })
  return normalize(extracted)
}

export async function extractRecipeFromUrl(url, aiConfig) {
  const pageText = await fetchUrlText(url)
  const extracted = await callAI(aiConfig, { bodyText: pageText.slice(0, 20000) })
  return normalize(extracted, { sourceUrl: url })
}

export async function extractRecipeFromImage(base64, mediaType, aiConfig) {
  const extracted = await callAI(aiConfig, { image: { base64, mediaType } })
  return normalize(extracted)
}

const SLOT_LABELS = Object.fromEntries(SLOTS.map((s) => [s.key, s.group ? `${s.group} ${s.label}` : s.label]))

function buildWeekPrompt(constraints) {
  return `Eres un planificador de menús semanales. Te doy un catálogo de recetas disponibles (id | nombre | categorías | minutos | kcal) y tienes que rellenar un calendario de lunes a domingo, con estas franjas cada día: ${SLOTS.map((s) => SLOT_LABELS[s.key]).join(', ')}.

Reglas:
- Usa SOLO ids del catálogo que te doy — no inventes ids ni recetas nuevas.
- No repitas la misma receta más de 2 veces en toda la semana, y evita repetirla en días seguidos.
- Reparte bien las categorías (pescado, carne, pollo, legumbres, pasta/arroz...) a lo largo de la semana — variedad ante todo.
- Si no hay ninguna receta adecuada para un hueco, dejalo como null en vez de forzar una mala combinación.
- Preferencias del usuario para esta semana: ${constraints?.trim() || 'ninguna en concreto — prioriza variedad y equilibrio.'}
- Responde con un id de receta (o null) para cada día y cada franja, usando exactamente estas claves de día: ${DAYS.map((d) => d.key).join(', ')}; y estas claves de franja: ${SLOTS.map((s) => s.key).join(', ')}.`
}

function weekResultToAssignments(result, validIds) {
  const assignments = {}
  for (const day of DAYS) {
    const daySlots = result?.[day.key]
    if (!daySlots) continue
    const slots = {}
    for (const slot of SLOTS) {
      const recipeId = daySlots[slot.key]
      slots[slot.key] = recipeId && validIds.has(recipeId) ? recipeId : null
    }
    assignments[day.key] = slots
  }
  return assignments
}

// Le pide al motor de IA elegido que rellene una semana entera escogiendo
// SOLO entre las recetas ya disponibles (locales + guardadas) — así el
// resultado sigue funcionando con la lista de la compra y el resto de la
// app sin necesitar inventar recetas nuevas.
export async function generateWeekWithAI({ constraints, availableRecipes, aiConfig }) {
  const catalogText = availableRecipes
    .map((r) => `${r.id} | ${r.name} | ${r.categories.join(',')} | ${r.time || '?'} min | ${r.kcal || '?'} kcal`)
    .join('\n')
  const instructionText = buildWeekPrompt(constraints)
  const bodyText = `Catálogo de recetas disponibles:\n${catalogText}`

  const zodSchemaBuilder = (z) => {
    const daySlotShape = z.object(Object.fromEntries(SLOTS.map((s) => [s.key, z.string().nullable()])))
    return z.object(Object.fromEntries(DAYS.map((d) => [d.key, daySlotShape])))
  }
  const slotProps = Object.fromEntries(SLOTS.map((s) => [s.key, { type: 'STRING', nullable: true }]))
  const responseSchema = {
    type: 'OBJECT',
    properties: Object.fromEntries(DAYS.map((d) => [d.key, { type: 'OBJECT', properties: slotProps }])),
  }
  const exampleDay = `{${SLOTS.map((s) => `"${s.key}": "id-receta-o-null"`).join(', ')}}`
  const jsonShapeHint = `Responde ÚNICAMENTE con un JSON válido (sin bloque de código, sin texto antes ni después) con esta forma exacta, una entrada por cada día: {${DAYS.map((d) => `"${d.key}": ${exampleDay}`).join(', ')}}`

  const def = AI_ENGINES[aiConfig.engine]
  if (!def) throw new Error('Motor de IA no reconocido — elige uno en Ajustes.')
  const mod = await def.loader()
  const result = await mod.extract({
    instructionText,
    bodyText,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    zodSchemaBuilder,
    responseSchema,
    jsonShapeHint,
  })

  const validIds = new Set(availableRecipes.map((r) => r.id))
  const assignments = weekResultToAssignments(result, validIds)
  const filledCount = Object.values(assignments).reduce(
    (n, slots) => n + Object.values(slots).filter(Boolean).length,
    0
  )
  if (!filledCount) {
    throw new Error('La IA no ha podido asignar ninguna receta. Prueba a cambiar las preferencias o revisa tu recetario.')
  }
  return assignments
}

// Lector de páginas sin backend propio: r.jina.ai convierte cualquier URL en
// texto limpio (sin HTML/scripts) y permite CORS desde cualquier origen.
async function fetchUrlText(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Esa URL no parece válida.')
  }

  let res
  try {
    res = await fetch(`https://r.jina.ai/${parsed.href}`)
  } catch {
    throw new Error('No se pudo leer esa página (sin conexión o bloqueada). Prueba a pegar el texto en su lugar.')
  }
  if (!res.ok) {
    throw new Error(`No se pudo leer esa página (${res.status}). Prueba a pegar el texto en su lugar.`)
  }
  return res.text()
}
