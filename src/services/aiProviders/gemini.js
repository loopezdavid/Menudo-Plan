// Google Gemini — REST directo (sin SDK), acepta CORS desde el navegador
// con solo la API key en la URL. Salida forzada a JSON con response_schema.
const DEFAULT_MODEL = 'gemini-3.6-flash'

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

export async function extract({ instructionText, bodyText, image, apiKey, model }) {
  if (!apiKey) throw new Error('Falta la API key de Gemini (Ajustes → Importar con IA).')

  const parts = [{ text: bodyText ? `${instructionText}\n\n${bodyText}` : instructionText }]
  if (image) parts.push({ inline_data: { mime_type: image.mediaType, data: image.base64 } })

  const modelId = model?.trim() || DEFAULT_MODEL
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
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini ${res.status}`
    if (res.status === 400 && /api key/i.test(msg)) throw new Error('La API key de Gemini no es válida.')
    if (res.status === 403) throw new Error('La API key de Gemini no es válida o no tiene permiso.')
    if (res.status === 404) throw new Error(`El modelo de Gemini "${modelId}" no existe o no está disponible. Prueba con otro en Ajustes.`)
    throw new Error(msg)
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini no devolvió ninguna respuesta interpretable.')
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Gemini devolvió una respuesta que no se pudo interpretar como JSON.')
  }
}
