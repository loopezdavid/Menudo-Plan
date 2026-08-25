// OpenRouter — proxy compatible con OpenAI a cientos de modelos, con CORS
// abierto para uso directo desde el navegador. El modelo es obligatorio: no
// hay un "mejor por defecto" cuando el catálogo cambia constantemente, así
// que el usuario lo elige en Ajustes (p.ej. "google/gemini-2.0-flash-001").
const JSON_SHAPE_HINT =
  'Responde ÚNICAMENTE con un JSON válido (sin bloque de código, sin texto antes ni después) con esta forma exacta: ' +
  '{"found": boolean, "name": string, "category": string|null, "servings": number|null, "timeMinutes": number|null, ' +
  '"imageUrl": string|null, "ingredients": [{"name": string, "quantity": number, "unit": string}], "steps": [string]}'

export async function extract({ instructionText, bodyText, image, apiKey, model }) {
  if (!apiKey) throw new Error('Falta la API key de OpenRouter (Ajustes → Importar con IA).')
  if (!model?.trim()) {
    throw new Error('Indica qué modelo de OpenRouter usar en Ajustes (p.ej. "google/gemini-2.0-flash-001").')
  }

  const text = `${bodyText ? `${instructionText}\n\n${bodyText}` : instructionText}\n\n${JSON_SHAPE_HINT}`
  const content = [{ type: 'text', text }]
  if (image) content.push({ type: 'image_url', image_url: { url: `data:${image.mediaType};base64,${image.base64}` } })

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://menusemanal.local',
      'X-Title': 'MenuSemanal',
    },
    body: JSON.stringify({
      model: model.trim(),
      messages: [{ role: 'user', content }],
      response_format: { type: 'json_object' },
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = data?.error?.message || `OpenRouter ${res.status}`
    if (res.status === 401) throw new Error('La API key de OpenRouter no es válida.')
    if (res.status === 402) throw new Error('No hay crédito suficiente en tu cuenta de OpenRouter.')
    if (res.status === 404) throw new Error(`El modelo "${model}" no existe en OpenRouter. Revisa el id en openrouter.ai/models.`)
    throw new Error(msg)
  }

  const raw = data?.choices?.[0]?.message?.content
  if (!raw) throw new Error('OpenRouter no devolvió ninguna respuesta interpretable.')
  const text2 = typeof raw === 'string' ? raw : raw.map((p) => p.text || '').join('')
  try {
    return JSON.parse(text2)
  } catch {
    throw new Error('El modelo devolvió una respuesta que no se pudo interpretar como JSON. Prueba con otro modelo.')
  }
}
