// Claude (Anthropic) — client.messages.parse() con salida estructurada (zod).
// SDK cargado con import() dinámico para no engordar el bundle de quien no
// use el importador. Ver skill claude-api: dangerouslyAllowBrowser es la
// forma soportada de llamar a la API directamente desde el navegador.
const MODEL = 'claude-opus-5'

let modulesPromise = null
function loadModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import('@anthropic-ai/sdk'),
      import('zod'),
      import('@anthropic-ai/sdk/helpers/zod'),
    ]).then(([anthropicMod, zodMod, zodHelperMod]) => {
      const Anthropic = anthropicMod.default
      const z = zodMod.z
      const schema = z.object({
        found: z.boolean().describe('true si el contenido contiene una receta de cocina reconocible'),
        name: z.string(),
        category: z
          .string()
          .nullable()
          .describe('tipo de plato o cocina en una o dos palabras, p.ej. "pollo", "pasta", "postre", "mexicana"'),
        servings: z.number().int().min(1).max(20).nullable(),
        timeMinutes: z.number().int().min(0).nullable(),
        imageUrl: z.string().nullable().describe('URL absoluta de una foto del plato si aparece en el contenido, si no null'),
        ingredients: z.array(
          z.object({
            name: z.string(),
            quantity: z.number(),
            unit: z.string(),
          })
        ),
        steps: z.array(z.string()),
      })
      return { Anthropic, format: zodHelperMod.zodOutputFormat(schema) }
    })
  }
  return modulesPromise
}

export async function extract({ instructionText, bodyText, image, apiKey }) {
  if (!apiKey) throw new Error('Falta la API key de Claude (Ajustes → Importar con IA).')
  const { Anthropic, format } = await loadModules()
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const content = [{ type: 'text', text: instructionText }]
  if (bodyText) content.push({ type: 'text', text: bodyText })
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } })

  let response
  try {
    response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: 'user', content }],
      output_config: { format },
    })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error('La API key de Claude no es válida (revísala en Ajustes).')
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error('Claude está saturado ahora mismo, prueba de nuevo en unos segundos.')
    }
    throw new Error(err.message || 'No se pudo contactar con Claude.')
  }
  if (!response.parsed_output) {
    throw new Error('Claude no devolvió una receta interpretable. Prueba a reformular el texto.')
  }
  return response.parsed_output
}
