// Descarga (una sola vez) una foto representativa de cada receta desde Wikimedia
// Commons (contenido de reuso libre), la optimiza a .webp y la guarda en
// src/assets/recipes/<id>.webp. También genera src/data/recipeImageCredits.json
// con la atribución de cada foto (autor, licencia, enlace de origen).
//
// Uso: node scripts/fetch-recipe-images.mjs [--force] [id1 id2 ...]

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../src/assets/recipes')
const CREDITS_PATH = path.resolve(__dirname, '../src/data/recipeImageCredits.json')
const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const ONLY = args.filter((a) => !a.startsWith('--'))

const UA = 'MenuSemanal-personal-app/1.0 (uso personal, no comercial)'

// id de receta -> lista de términos de búsqueda en inglés a probar en orden
// (mejor cobertura y relevancia en Commons que el nombre en español).
const QUERIES = {
  'poke-salmon': ['salmon poke bowl'],
  vichyssoise: ['vichyssoise soup leek potato'],
  'arroz-almejas': ['clams rice paella', 'seafood rice paella'],
  'pasta-bolonesa': ['spaghetti bolognese'],
  'garbanzos-griegos': ['chickpea salad feta', 'mediterranean chickpea bowl'],
  'pasta-calabaza-pollo': ['pumpkin pasta', 'butternut squash pasta chicken'],
  'berenjena-rellena': ['stuffed eggplant', 'stuffed aubergine minced meat'],
  'bacalao-puerro': ['cod fillet plate', 'baked cod fillet dinner'],
  'salmon-miel-mostaza': ['glazed salmon fillet', 'grilled salmon plate rice'],
  'wrap-pollo': ['crispy chicken wrap'],
  'tallarines-ternera': ['beef noodles stir fry'],
  'noodles-pollo-curry': ['chicken curry noodles', 'thai chicken curry noodles'],
  'pollo-griego': ['greek lemon chicken', 'chicken souvlaki gyro'],
  'pasta-boletus-trufa': ['mushroom truffle pasta', 'creamy mushroom pasta'],
  'tacos-merluza': ['fish tacos', 'crispy fish taco plate'],
  'ternera-chimichurri': ['beef chimichurri'],
  'pollo-souvlaki': ['souvlaki plate', 'greek souvlaki skewer meat'],
  'pollo-parmigiana': ['chicken parmigiana'],
  'tacos-ternera-especiada': ['beef tacos street food', 'carne asada tacos plate'],
  'chicken-katsu-curry': ['chicken katsu curry rice'],
  'smash-burger': ['smash burger fries'],
  'korean-crispy-chicken': ['korean fried chicken', 'korean fried chicken wings bowl'],
  'butter-chicken': ['butter chicken curry'],
  'crema-zanahoria-curry-naranja': ['carrot soup curry', 'carrot soup bowl'],
  'crema-calabacin-parmesano': ['zucchini soup', 'creamy courgette soup'],
  salmorejo: ['salmorejo', 'cold tomato soup spanish'],
  'ensaladilla-rusa': ['russian salad olivier', 'potato salad mayonnaise bowl'],
  'judias-verdes-jamon': ['green beans almondine', 'haricots verts'],
  'tomate-asado-mozzarella': ['caprese tomato mozzarella', 'roasted tomato mozzarella basil'],
  'pancakes-avena-platano': ['banana oat pancakes', 'banana pancakes stack'],
  'french-toast-proteica': ['french toast berries'],
  'tostadas-huevo-pavo-queso': ['egg toast breakfast sandwich', 'fried egg toast plate'],
  'overnight-oats-tiramisu': ['overnight oats jar', 'tiramisu dessert jar'],

  // ---- Recetas healthy / equilibradas (añadidas en bloque) ----
  'bowl-quinoa-pollo': ['chicken quinoa bowl', 'grilled chicken quinoa vegetables'],
  'salmon-teriyaki-brocoli': ['teriyaki salmon broccoli', 'glazed salmon broccoli plate'],
  'ensalada-atun-garbanzos': ['tuna chickpea salad', 'chickpea salad tuna bowl'],
  'pechuga-pollo-limon-esparragos': ['lemon chicken asparagus', 'grilled chicken asparagus plate'],
  'gambas-ajillo-quinoa': ['garlic shrimp quinoa', 'gambas al ajillo plate'],
  'tofu-salteado-verduras': ['tofu vegetable stir fry', 'stir fried tofu vegetables'],
  'boniato-relleno-pavo': ['stuffed sweet potato turkey', 'stuffed sweet potato bowl'],
  'crema-brocoli-almendras': ['broccoli almond soup', 'creamy broccoli soup bowl'],
  'ensalada-quinoa-feta': ['quinoa feta salad', 'mediterranean quinoa salad'],
  'merluza-papillote-verduras': ['fish papillote vegetables', 'baked hake fillet vegetables'],
  'pollo-boniato-airfryer': ['air fryer chicken sweet potato', 'roasted chicken sweet potato plate'],
  'wrap-hummus-pollo': ['chicken hummus wrap', 'grilled chicken wrap vegetables'],
  'lentejas-estofadas-verduras': ['lentil stew vegetables', 'braised lentils bowl'],
  'poke-atun-integral': ['tuna poke bowl', 'ahi tuna poke bowl rice'],
  'tortilla-espinacas-champinones': ['spinach mushroom omelette', 'frittata spinach mushroom'],
  'pasta-integral-pesto-tomate': ['whole wheat pasta pesto', 'pasta pesto cherry tomatoes'],
  'salteado-ternera-verduras-soja': ['beef vegetable stir fry', 'beef stir fry soy sauce'],
  'curry-garbanzos-espinacas': ['chickpea spinach curry', 'chana masala spinach'],
  'dorada-horno-limon': ['baked sea bream lemon', 'whole roasted fish lemon'],
  'brochetas-pollo-pimiento-airfryer': ['chicken skewers peppers', 'air fryer chicken kebab'],
  'arroz-integral-verduras-tofu': ['brown rice tofu vegetables', 'tofu vegetable rice bowl'],
  'sopa-miso-tofu': ['miso soup tofu', 'japanese miso soup bowl'],
  'ensalada-templada-pollo-aguacate': ['warm chicken avocado salad', 'grilled chicken avocado salad'],
  'albondigas-pavo-tomate': ['turkey meatballs tomato sauce', 'turkey meatballs plate'],
  'bowl-salmon-boniato': ['salmon sweet potato bowl', 'salmon bowl roasted vegetables'],
  'gazpacho-clasico': ['gazpacho soup bowl', 'spanish cold tomato soup'],
  'tostas-aguacate-huevo': ['avocado toast egg', 'avocado toast poached egg'],
  'yogur-frutos-rojos-granola': ['yogurt granola berries', 'greek yogurt berries granola bowl'],
  'porridge-platano-canela': ['banana cinnamon oatmeal', 'porridge banana bowl'],
  'batido-proteico-platano': ['banana protein smoothie', 'banana smoothie glass'],
  'pollo-teriyaki-arroz': ['teriyaki chicken rice', 'teriyaki chicken bowl rice'],
  'merluza-en-salsa-verde': ['hake green sauce', 'merluza salsa verde plate'],
  'ensalada-cous-cous-verduras': ['couscous vegetable salad', 'couscous salad bowl'],
  'pisto-huevo-horno': ['ratatouille baked egg', 'pisto with egg'],
  'pollo-curry-coco-verduras': ['coconut curry chicken', 'chicken coconut curry bowl'],
  'hamburguesa-pavo-integral': ['turkey burger whole wheat bun', 'turkey burger plate'],
  'salmon-airfryer-mostaza': ['mustard salmon air fryer', 'baked salmon mustard glaze'],
  'ensalada-templada-quinoa-gambas': ['shrimp quinoa salad', 'warm quinoa shrimp salad'],
  'berenjenas-horno-tahini': ['roasted eggplant tahini', 'baked aubergine tahini'],
  'pasta-integral-atun-tomate': ['whole wheat pasta tuna tomato', 'pasta tuna tomato sauce'],
  'revuelto-espinacas-champinones': ['scrambled eggs spinach mushroom', 'spinach mushroom scramble'],
  'arroz-caldoso-marisco-ligero': ['seafood soupy rice', 'arroz caldoso seafood'],
  'estofado-ternera-verduras-olla': ['beef vegetable stew', 'beef stew pot vegetables'],
  'buda-bowl-garbanzos-tahini': ['buddha bowl chickpea tahini', 'chickpea buddha bowl vegetables'],
  'lubina-horno-verduras': ['baked sea bass vegetables', 'roasted sea bass plate'],
  'pollo-fajitas-integrales': ['chicken fajitas whole wheat', 'chicken fajitas plate peppers'],
  'crema-calabaza-jengibre': ['pumpkin ginger soup', 'butternut squash ginger soup'],
  'ensalada-mediterranea-pollo': ['mediterranean chicken salad', 'grilled chicken salad olives feta'],
  'salteado-tofu-noodles-integrales': ['tofu noodle stir fry', 'whole wheat noodles tofu vegetables'],
  'porridge-proteico-frutos-secos': ['protein oatmeal nuts', 'oatmeal bowl nuts seeds'],
}

const BAD_TITLE_WORDS = ['logo', 'map', 'flag', 'diagram', 'icon', 'chart', 'graph', 'coat of arms', 'location', 'menu card', 'restaurant front', 'exterior']

async function fetchWithRetry(url, options, tries = 6) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url, options)
    if (res.status !== 429) return res
    const retryAfter = Number(res.headers.get('retry-after'))
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 3000
    console.warn(`  429, reintentando en ${wait}ms (intento ${attempt}/${tries})`)
    await new Promise((r) => setTimeout(r, wait))
  }
  return fetch(url, options)
}

async function api(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`
  const res = await fetchWithRetry(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`API ${res.status} ${url}`)
  return res.json()
}

function scoreTitle(title, query) {
  const t = title.toLowerCase()
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  return words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
}

async function findImage(query) {
  const data = await api({
    action: 'query',
    list: 'search',
    srnamespace: '6',
    srlimit: '12',
    srsearch: `${query} filetype:bitmap`,
  })
  const results = data?.query?.search || []
  const clean = results.filter((r) => {
    const t = r.title.toLowerCase()
    if (!/\.(jpe?g|png)$/.test(t)) return false
    return !BAD_TITLE_WORDS.some((w) => t.includes(w))
  })
  if (!clean.length) return null

  clean.sort((a, b) => scoreTitle(b.title, query) - scoreTitle(a.title, query))
  const best = clean[0]
  if (scoreTitle(best.title, query) === 0) return null // ningún resultado relevante

  const info = await api({
    action: 'query',
    titles: best.title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1000',
  })
  const pages = info?.query?.pages || {}
  const page = Object.values(pages)[0]
  const ii = page?.imageinfo?.[0]
  if (!ii) return null

  const meta = ii.extmetadata || {}
  return {
    title: best.title,
    thumbUrl: ii.thumburl || ii.url,
    descriptionUrl: ii.descriptionurl,
    artist: stripHtml(meta.Artist?.value) || 'Wikimedia Commons',
    licenseShortName: meta.LicenseShortName?.value || 'Ver licencia',
  }
}

function stripHtml(str) {
  return str ? str.replace(/<[^>]+>/g, '').trim() : ''
}

async function downloadAndOptimize(url, destPath) {
  const res = await fetchWithRetry(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`download ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await sharp(buf)
    .resize({ width: 900, height: 675, fit: 'cover', position: 'attention' })
    .webp({ quality: 72 })
    .toFile(destPath)
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  let credits = {}
  try {
    credits = JSON.parse(await fs.readFile(CREDITS_PATH, 'utf8'))
  } catch {}

  const entries = Object.entries(QUERIES).filter(([id]) => !ONLY.length || ONLY.includes(id))
  for (const [id, queries] of entries) {
    const destPath = path.join(OUT_DIR, `${id}.webp`)
    const exists = await fs.stat(destPath).then(() => true).catch(() => false)
    if (exists && !FORCE) {
      console.log(`skip (ya existe) ${id}`)
      continue
    }

    let found = null
    for (const q of queries) {
      try {
        found = await findImage(q)
        if (found) break
        await new Promise((r) => setTimeout(r, 600))
      } catch (err) {
        console.error(`  búsqueda "${q}" falló:`, err.message)
      }
    }

    if (!found) {
      console.warn(`sin resultado: ${id} (${queries.join(' / ')})`)
      await new Promise((r) => setTimeout(r, 800))
      continue
    }

    try {
      await downloadAndOptimize(found.thumbUrl, destPath)
      credits[id] = {
        title: found.title,
        artist: found.artist,
        license: found.licenseShortName,
        source: found.descriptionUrl,
      }
      console.log(`ok ${id} <- ${found.title}`)
    } catch (err) {
      console.error(`error ${id}:`, err.message)
    }

    await new Promise((r) => setTimeout(r, 1200))
  }

  await fs.writeFile(CREDITS_PATH, JSON.stringify(credits, null, 2) + '\n')
  console.log(`\nCréditos guardados en ${path.relative(process.cwd(), CREDITS_PATH)}`)
}

main()
