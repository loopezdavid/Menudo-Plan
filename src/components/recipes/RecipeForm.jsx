import { useRef, useState } from 'react'
import { Plus, Trash2, Camera, X, Search, Loader2, Sparkles, ExternalLink } from 'lucide-react'
import { CATEGORY_TAGS } from '../../data/categoryTags'
import { classifyIngredient } from '../../utils/ingredientMatch'
import { searchDishPhotos, searchGoogleImages } from '../../services/imageSearch'
import { useStore } from '../../store/useStore'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_DIM = 1024
const IMAGE_QUALITY = 0.75

function blankIngredient() {
  return { name: '', quantity: 1, unit: 'g' }
}

// Redimensiona y comprime una imagen (ya cargada, de archivo local o de una
// URL remota con CORS abierto) antes de guardarla como data URL — así no se
// llena el almacenamiento local con fotos a resolución completa.
function compressImage(img, maxDim = MAX_IMAGE_DIM, quality = IMAGE_QUALITY) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

function compressImageFile(file, maxDim = MAX_IMAGE_DIM, quality = IMAGE_QUALITY) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => resolve(compressImage(img, maxDim, quality))
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Descarga una foto encontrada en internet y la comprime igual que una
// subida manual, para que quede disponible sin conexión. Si el servidor no
// permite lectura por CORS (canvas "tainted"), se usa la URL directa como
// respaldo — se verá igual, pero solo con conexión.
function compressImageFromUrl(url, maxDim = MAX_IMAGE_DIM, quality = IMAGE_QUALITY) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => resolve(url)
    img.onload = () => {
      try {
        resolve(compressImage(img, maxDim, quality))
      } catch {
        resolve(url)
      }
    }
    img.src = url
  })
}

export default function RecipeForm({ recipe, onSave, onCancel }) {
  const [name, setName] = useState(recipe.name || '')
  const [category, setCategory] = useState(recipe.categories?.[0] || 'internacional')
  const [servings, setServings] = useState(recipe.servings || 4)
  const [time, setTime] = useState(recipe.time || '')
  const [ingredients, setIngredients] = useState(
    recipe.ingredients?.length ? recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })) : [blankIngredient()]
  )
  const [steps, setSteps] = useState(recipe.steps?.length ? [...recipe.steps] : [''])
  const [image, setImage] = useState(recipe.image || null)
  const [imageError, setImageError] = useState(null)
  const photoInputRef = useRef(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(recipe.name || '')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [pickingIndex, setPickingIndex] = useState(null)
  const [resultsSource, setResultsSource] = useState(null) // 'google' | 'commons'

  const googleKey = useStore((s) => s.settings.apiKeys?.googleSearchApiKey || '')
  const googleCx = useStore((s) => s.settings.apiKeys?.googleSearchCx || '')
  const googleReady = !!(googleKey && googleCx)

  const canSave = name.trim() && ingredients.some((i) => i.name.trim())

  async function handlePhotoPick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Formato no admitido. Usa JPG, PNG, WEBP o GIF.')
      return
    }
    try {
      setImageError(null)
      setImage(await compressImageFile(file))
    } catch {
      setImageError('No se pudo procesar esa foto, prueba con otra.')
    }
  }

  async function runPhotoSearch(query, { autoPick = false } = {}) {
    const q = (query ?? searchQuery).trim() || name.trim()
    if (!q) {
      setImageError('Escribe primero el nombre del plato para poder buscarlo.')
      return
    }
    setSearchOpen(true)
    setSearching(true)
    setImageError(null)
    setSearchResults([])
    setResultsSource(null)
    try {
      let results = []
      let source = null

      if (googleReady) {
        try {
          results = await searchGoogleImages(q, { apiKey: googleKey, cx: googleCx })
          source = 'google'
        } catch (err) {
          // Si Google falla (key/cx mal configurados, cuota agotada…) seguimos
          // con Wikimedia Commons en vez de dejar al usuario sin nada.
          setImageError(err.message)
        }
      }

      if (!results.length) {
        results = await searchDishPhotos(q)
        source = 'commons'
      }

      setSearchResults(results)
      setResultsSource(source)

      if (!results.length) {
        setImageError(
          googleReady
            ? 'No he encontrado fotos para ese nombre ni en Google ni en Wikimedia Commons. Prueba con otro término.'
            : 'No he encontrado fotos para ese nombre en Wikimedia Commons. Prueba con otro término (en inglés suele dar mejores resultados), o configura Google Imágenes en Ajustes para más cobertura.'
        )
      } else if (autoPick) {
        await handlePickSearchResult(results[0], 0)
      }
    } catch (err) {
      setImageError(err.message || 'No se pudo buscar fotos.')
    } finally {
      setSearching(false)
    }
  }

  async function handlePickSearchResult(result, index) {
    setPickingIndex(index)
    setImageError(null)
    try {
      setImage(await compressImageFromUrl(result.thumbUrl))
      setSearchOpen(false)
    } catch {
      setImageError('No se pudo usar esa foto, prueba con otra.')
    } finally {
      setPickingIndex(null)
    }
  }

  function updateIngredient(i, patch) {
    setIngredients((list) => list.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing)))
  }

  function updateStep(i, value) {
    setSteps((list) => list.map((s, idx) => (idx === i ? value : s)))
  }

  function handleSave() {
    const cleanIngredients = ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        ingredientId: null,
        name: i.name.trim(),
        quantity: Number(i.quantity) || 1,
        unit: i.unit.trim() || 'ud',
        category: classifyIngredient(i.name),
      }))
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean)

    onSave({
      ...recipe,
      name: name.trim(),
      categories: [category],
      servings: Number(servings) || 4,
      time: time ? Number(time) : null,
      ingredients: cleanIngredients,
      steps: cleanSteps.length ? cleanSteps : null,
      image: image || null,
    })
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div>
        <label className="block text-[12px] font-semibold text-text-muted mb-1.5">Foto del plato</label>
        <input
          ref={photoInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handlePhotoPick}
          className="hidden"
        />
        {image ? (
          <div className="relative rounded-2xl overflow-hidden h-40 w-full">
            <img src={image} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => photoInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/0 active:bg-black/20 transition"
              aria-label="Cambiar foto"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition"
              aria-label="Quitar foto"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => photoInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-2/60 h-32 w-full text-text-muted"
          >
            <Camera size={20} />
            <span className="text-[12.5px] font-medium">Añadir foto del plato (opcional)</span>
          </button>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => (searchOpen ? setSearchOpen(false) : runPhotoSearch())}
            disabled={searching}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-surface-2 py-2.5 text-[12px] font-semibold text-text active:scale-[0.98] transition disabled:opacity-50 min-w-0"
          >
            <Search size={13} className="shrink-0" /> <span className="truncate">Buscar fotos</span>
          </button>
          <button
            onClick={() => runPhotoSearch(undefined, { autoPick: true })}
            disabled={searching}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-surface-2 py-2.5 text-[12px] font-semibold text-text active:scale-[0.98] transition disabled:opacity-50 min-w-0"
          >
            {searching ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Sparkles size={13} className="shrink-0" />}
            <span className="truncate">Autocompletar</span>
          </button>
        </div>
        {!googleReady && (
          <p className="text-[10.5px] text-text-muted mt-1.5">
            Busca en Wikimedia Commons. Para buscar en Google Imágenes (mejor cobertura para platos concretos), configura tu key en Ajustes → Importar con IA.
          </p>
        )}

        {searchOpen && (
          <div className="mt-2 rounded-2xl bg-surface-2 p-3">
            <div className="flex gap-1.5 mb-2.5">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runPhotoSearch()}
                placeholder="p. ej. bacalao al pil pil"
                className="flex-1 min-w-0 rounded-xl bg-surface border border-transparent focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft"
              />
              <button
                onClick={() => runPhotoSearch()}
                disabled={searching}
                className="shrink-0 rounded-xl bg-primary-500 px-3.5 text-[13px] font-semibold text-white active:scale-95 transition disabled:opacity-50"
              >
                {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              </button>
            </div>

            {searching && (
              <div className="flex items-center justify-center gap-2 py-6 text-[12.5px] text-text-muted">
                <Loader2 size={15} className="animate-spin" /> Buscando fotos…
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {searchResults.map((r, i) => (
                    <button
                      key={`${i}-${r.title}`}
                      onClick={() => handlePickSearchResult(r, i)}
                      disabled={pickingIndex !== null}
                      className="relative aspect-square rounded-xl overflow-hidden bg-surface disabled:opacity-60"
                    >
                      <img src={r.thumbUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      {pickingIndex === i && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 size={16} className="animate-spin text-white" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10.5px] text-text-muted mt-2 flex items-center gap-1">
                  {resultsSource === 'google' ? 'Fotos de Google Imágenes' : 'Fotos de Wikimedia Commons (reuso libre)'}
                  <ExternalLink size={9} />
                </p>
              </>
            )}
          </div>
        )}

        {imageError && <p className="text-[11px] text-rose-600 mt-1.5">{imageError}</p>}
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-text-muted mb-1.5">Nombre de la receta</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p. ej. Lentejas de mi abuela"
          className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3.5 py-2.5 text-sm text-text placeholder:text-text-soft"
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div>
          <label className="block text-[12px] font-semibold text-text-muted mb-1.5">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-2.5 py-2.5 text-sm text-text"
          >
            {Object.entries(CATEGORY_TAGS).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-text-muted mb-1.5">Raciones</label>
          <input
            type="number"
            min="1"
            max="20"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-2.5 py-2.5 text-sm text-text"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-text-muted mb-1.5">Minutos</label>
          <input
            type="number"
            min="0"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="—"
            className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-2.5 py-2.5 text-sm text-text placeholder:text-text-soft"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-semibold text-text-muted">Ingredientes</label>
        </div>
        <div className="flex flex-col gap-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={ing.name}
                onChange={(e) => updateIngredient(i, { name: e.target.value })}
                placeholder="Ingrediente"
                className="flex-1 min-w-0 rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft"
              />
              <input
                type="number"
                value={ing.quantity}
                onChange={(e) => updateIngredient(i, { quantity: e.target.value })}
                className="w-16 shrink-0 rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-2 py-2 text-[13px] text-text"
              />
              <input
                value={ing.unit}
                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                placeholder="g"
                className="w-14 shrink-0 rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-2 py-2 text-[13px] text-text placeholder:text-text-soft"
              />
              <button
                onClick={() => setIngredients((list) => list.filter((_, idx) => idx !== i))}
                className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-text-soft active:scale-90 transition"
                aria-label="Quitar ingrediente"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIngredients((list) => [...list, blankIngredient()])}
          className="mt-2 flex items-center gap-1 text-[12.5px] font-semibold text-primary-600"
        >
          <Plus size={13} /> Añadir ingrediente
        </button>
      </div>

      <div>
        <label className="text-[12px] font-semibold text-text-muted mb-1.5 block">Preparación</label>
        <div className="flex flex-col gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="shrink-0 h-8 w-8 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                rows={2}
                placeholder="Describe este paso"
                className="flex-1 min-w-0 rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft resize-none"
              />
              <button
                onClick={() => setSteps((list) => list.filter((_, idx) => idx !== i))}
                className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-text-soft active:scale-90 transition mt-0.5"
                aria-label="Quitar paso"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setSteps((list) => [...list, ''])}
          className="mt-2 flex items-center gap-1 text-[12.5px] font-semibold text-primary-600"
        >
          <Plus size={13} /> Añadir paso
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-text-muted active:scale-[0.98] transition"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 rounded-2xl bg-primary-500 py-3 text-sm font-semibold text-white active:scale-[0.98] transition disabled:opacity-40"
        >
          Guardar receta
        </button>
      </div>
    </div>
  )
}
