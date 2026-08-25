// Mistral — chat completions compatible con OpenAI. Sin modo de esquema
// JSON confirmado en su documentación pública, así que se pide el JSON en
// el propio prompt y se activa response_format: json_object (sí documentado
// y estable) para forzar que la respuesta sea JSON parseable.
const DEFAULT_MODEL = 'mistral-small-latest'

const JSON_SHAPE_HINT =
  'Responde ÚNICAMENTE con un JSON válido (sin bloque de código, sin texto antes ni después) con esta forma exacta: ' +
  '{"found": boolean, "name": string, "category": string|null, "servings": number|null, "timeMinutes": number|null, ' +
  '"imageUrl": string|null, "ingredients": [{"name": string, "quantity": number, "unit": string}], "steps": [string]}'

export async function extract({ instructionText, bodyText, image, apiKey, model }) {
  if (!apiKey) throw new Error('Falta la API key de Mistral (Ajustes → Importar con IA).')

  const text = `${bodyText ? `${instructionText}\n\n${bodyText}` : instructionText}\n\n${JSON_SHAPE_HINT}`
  const content = [{ type: 'text', text }]
  if (image) content.push({ type: 'image_url', image_url: `data:${image.mediaType};base64,${image.base64}` })

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model?.trim() || DEFAULT_MODEL,
      messages: [{ role: 'user', content }],
      response_format: { type: 'json_object' },
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = data?.message || data?.error?.message || `Mistral ${res.status}`
    if (res.status === 401) throw new Error('La API key de Mistral no es válida.')
    throw new Error(msg)
  }

  const raw = data?.choices?.[0]?.message?.content
  if (!raw) throw new Error('Mistral no devolvió ninguna respuesta interpretable.')
  const text2 = typeof raw === 'string' ? raw : raw.map((p) => p.text || '').join('')
  try {
    return JSON.parse(text2)
  } catch {
    throw new Error('Mistral devolvió una respuesta que no se pudo interpretar como JSON.')
  }
}
