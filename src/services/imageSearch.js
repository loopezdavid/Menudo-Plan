// Busca fotos de platos en Wikimedia Commons (contenido de reuso libre, sin
// API key, con CORS abierto) para poder elegir una en el formulario de
// receta. Misma fuente que usa scripts/fetch-recipe-images.mjs para las
// fotos del catálogo local.
const BAD_TITLE_WORDS = [
  'logo', 'map', 'flag', 'diagram', 'icon', 'chart', 'graph',
  'coat of arms', 'location', 'menu card', 'restaurant front', 'exterior',
]

async function api(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`
  let res
  try {
    res = await fetch(url)
  } catch {
    throw new Error('No se pudo buscar fotos (sin conexión).')
  }
  if (!res.ok) throw new Error(`Wikimedia Commons ${res.status}`)
  return res.json()
}

function stripHtml(str) {
  return str ? str.replace(/<[^>]+>/g, '').trim() : ''
}

export async function searchDishPhotos(query, limit = 9) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const data = await api({
    action: 'query',
    list: 'search',
    srnamespace: '6',
    srlimit: String(limit * 2),
    srsearch: `${trimmed} filetype:bitmap`,
  })
  const results = data?.query?.search || []
  const clean = results
    .filter((r) => {
      const t = r.title.toLowerCase()
      if (!/\.(jpe?g|png|webp)$/.test(t)) return false
      return !BAD_TITLE_WORDS.some((w) => t.includes(w))
    })
    .slice(0, limit)
  if (!clean.length) return []

  const info = await api({
    action: 'query',
    titles: clean.map((r) => r.title).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '500',
  })
  const pages = Object.values(info?.query?.pages || {})
  const order = clean.map((r) => r.title)

  return pages
    .map((page) => {
      const ii = page.imageinfo?.[0]
      if (!ii) return null
      const meta = ii.extmetadata || {}
      return {
        title: page.title,
        thumbUrl: ii.thumburl || ii.url,
        descriptionUrl: ii.descriptionurl,
        artist: stripHtml(meta.Artist?.value) || 'Wikimedia Commons',
        license: meta.LicenseShortName?.value || '',
      }
    })
    .filter(Boolean)
    .sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title))
}

// Búsqueda de imágenes de Google (Custom Search JSON API), bring-your-own-key
// igual que los motores de IA — requiere una API key de Google Cloud (con la
// "Custom Search API" habilitada) y un motor de búsqueda programable
// (cx) con "Buscar imágenes" y "Buscar en toda la web" activados. Gratis
// hasta 100 búsquedas/día, luego de pago. Mucha mejor cobertura que
// Wikimedia Commons para platos concretos en español.
// Guía: aistudio no vale aquí — hace falta console.cloud.google.com
// (Custom Search API) + programmablesearchengine.google.com (el cx).
export async function searchGoogleImages(query, { apiKey, cx }, limit = 9) {
  const trimmed = query.trim()
  if (!trimmed || !apiKey || !cx) return []

  const url = `https://www.googleapis.com/customsearch/v1?${new URLSearchParams({
    key: apiKey,
    cx,
    q: trimmed,
    searchType: 'image',
    num: String(Math.min(limit, 10)),
    safe: 'active',
  })}`

  let res
  try {
    res = await fetch(url)
  } catch {
    throw new Error('No se pudo buscar en Google Imágenes (sin conexión).')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = data?.error?.message || `Google Custom Search ${res.status}`
    throw new Error(`Google Imágenes: ${msg}`)
  }

  return (data?.items || []).map((item) => ({
    title: item.title || query,
    thumbUrl: item.image?.thumbnailLink || item.link,
    fullUrl: item.link,
    descriptionUrl: item.image?.contextLink || item.link,
    artist: item.displayLink || 'Google',
    license: '',
  }))
}
