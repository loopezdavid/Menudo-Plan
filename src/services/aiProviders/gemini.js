// Google Gemini — REST directo (sin SDK), acepta CORS desde el navegador
// con solo la API key en la URL. Salida forzada a JSON con response_schema.
const DEFAULT_MODEL = 'gemini-3.6-flash'
// Si el modelo por defecto (o el que haya puesto el usuario) deja de existir
// — los nombres de Gemini cambian con frecuencia — se reintenta una vez con
// este, que lleva más tiempo estable, en vez de fallar sin más.
const FALLBACK_MODEL = 'gemini-2.0-flash'

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    found: { type: 'BOOLEAN' },
    name: { type: 'STRING' },
    category: { type: 'STRING', nullable: true },
    servings: { type: 'INTEGER', nullable: true },
    timeMinutes: { type: 'INTEGER', nullable: true },
    imageUrl: { type: 'STRING', nullable: true },
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          quantity: { type: 'NUMBER' },
          unit: { type: 'STRING' },
        },
        required: ['name', 'quantity', 'unit'],
      },
    },
    steps: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['found', 'name', 'ingredients', 'steps'],
}

async function callGemini(modelId, parts, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { response_mime_type: 'application/json', response_schema: SCHEMA },
      }),
    }
  )
  const data = await res.json().catch(() => null)
  return { res, data }
}

export async function extract({ instructionText, bodyText, image, apiKey, model }) {
  if (!apiKey) throw new Error('Falta la API key de Gemini (Ajustes → Importar con IA).')

  const parts = [{ text: bodyText ? `${instructionText}\n\n${bodyText}` : instructionText }]
  if (image) parts.push({ inline_data: { mime_type: image.mediaType, data: image.base64 } })

  const modelId = model?.trim() || DEFAULT_MODEL
  let { res, data } = await callGemini(modelId, parts, apiKey)

  // El modelo puede haber quedado obsoleto (los nombres de Gemini cambian a
  // menudo) — antes de rendirnos, reintentamos una vez con uno más estable.
  if (res.status === 404 && modelId !== FALLBACK_MODEL) {
    ;({ res, data } = await callGemini(FALLBACK_MODEL, parts, apiKey))
  }

  if (!res.ok) {
    const msg = data?.error?.message || `Gemini ${res.status}`
    if (res.status === 400 && /api key/i.test(msg)) throw new Error('La API key de Gemini no es válida.')
    if (res.status === 403) throw new Error('La API key de Gemini no es válida o no tiene permiso.')
    if (res.status === 404) throw new Error(`El modelo de Gemini "${modelId}" no existe o no está disponible. Prueba con otro en Ajustes.`)
    if (res.status === 429) throw new Error('Gemini está saturado o has agotado la cuota gratuita por hoy. Prueba de nuevo en un rato.')
    throw new Error(msg)
  }

  const blockReason = data?.promptFeedback?.blockReason
  if (blockReason) {
    throw new Error(`Gemini ha bloqueado la respuesta (${blockReason}). Prueba con otro texto o foto.`)
  }

  const candidate = data?.candidates?.[0]
  const text = candidate?.content?.parts?.[0]?.text
  if (!text) {
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`Gemini no terminó la respuesta (${candidate.finishReason}). Prueba con un texto más corto.`)
    }
    throw new Error('Gemini no devolvió ninguna respuesta interpretable.')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Gemini devolvió una respuesta que no se pudo interpretar como JSON.')
  }
}
