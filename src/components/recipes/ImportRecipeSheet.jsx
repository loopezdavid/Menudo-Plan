import { useRef, useState } from 'react'
import { PenLine, FileText, Link2, Camera, Loader2, AlertTriangle, Sparkles } from 'lucide-react'
import Sheet from '../ui/Sheet'
import RecipeForm from './RecipeForm'
import { useStore } from '../../store/useStore'
import {
  extractRecipeFromText,
  extractRecipeFromUrl,
  extractRecipeFromImage,
  getAiConfig,
  AI_ENGINES,
} from '../../services/aiRecipeImport'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const MODES = [
  { key: 'manual', label: 'Manual', icon: PenLine },
  { key: 'text', label: 'Texto', icon: FileText },
  { key: 'url', label: 'URL', icon: Link2 },
  { key: 'photo', label: 'Foto', icon: Camera },
]

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function blankRecipe() {
  return {
    id: `custom:${uid()}`,
    source: 'custom',
    sourceLabel: 'Manual',
    sourceUrl: null,
    name: '',
    categories: ['internacional'],
    servings: 4,
    time: null,
    ingredients: [],
    steps: [],
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ImportRecipeSheet({ open, onClose, onSaved }) {
  const [mode, setMode] = useState('manual')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState(() => blankRecipe())
  const fileInputRef = useRef(null)

  const settings = useStore((s) => s.settings)
  const cacheExternalRecipe = useStore((s) => s.cacheExternalRecipe)
  const aiConfig = getAiConfig(settings)
  const engineLabel = AI_ENGINES[aiConfig.engine]?.label || aiConfig.engine
  const engineReady = aiConfig.engine === 'openrouter' ? !!aiConfig.apiKey && !!aiConfig.model : !!aiConfig.apiKey

  function reset() {
    setMode('manual')
    setText('')
    setUrl('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setExtracting(false)
    setError(null)
    setDraft(blankRecipe())
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleModeChange(nextMode) {
    setMode(nextMode)
    setError(null)
    setDraft(nextMode === 'manual' ? blankRecipe() : null)
  }

  function handlePhotoPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Formato de imagen no admitido. Usa JPG, PNG, WEBP o GIF (los .heic del iPhone no valen, expórtala como JPG).')
      return
    }
    setError(null)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function runExtraction(fn) {
    setExtracting(true)
    setError(null)
    try {
      const recipe = await fn()
      setDraft(recipe)
    } catch (err) {
      setError(err.message || 'No se pudo extraer la receta.')
    } finally {
      setExtracting(false)
    }
  }

  function handleExtractText() {
    runExtraction(() => extractRecipeFromText(text, aiConfig))
  }

  function handleExtractUrl() {
    runExtraction(() => extractRecipeFromUrl(url, aiConfig))
  }

  async function handleExtractPhoto() {
    if (!photoFile) return
    const base64 = await fileToBase64(photoFile)
    runExtraction(() => extractRecipeFromImage(base64, photoFile.type, aiConfig))
  }

  function handleSave(recipe) {
    cacheExternalRecipe(recipe)
    handleClose()
    onSaved?.(recipe.id)
  }

  const needsKey = mode !== 'manual' && !engineReady

  return (
    <Sheet open={open} onClose={handleClose} title="Importar receta">
      <div className="mb-4 -mt-1">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar min-w-0">
          {MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                mode === key ? 'bg-primary-500 text-white shadow-sm' : 'bg-surface-2 text-text-muted'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        {mode !== 'manual' && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-muted">
            <Sparkles size={11} /> {engineLabel}
          </span>
        )}
      </div>

      {needsKey && !draft && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 text-amber-800 p-3.5 mb-4 text-[13px] leading-relaxed">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            Esto usa {engineLabel} para leer e interpretar la receta. Configura tu API key
            {aiConfig.engine === 'openrouter' ? ' y el modelo' : ''} en Ajustes → Importar con IA para activarlo (o
            cambia de motor ahí mismo).
          </span>
        </div>
      )}

      {!draft && mode === 'text' && (
        <div className="flex flex-col gap-3 pb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Pega el texto de una receta, o escribe solo el nombre de un plato (p.ej. «tortilla de patatas») y te la genera"
            className="w-full rounded-2xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3.5 py-3 text-sm text-text placeholder:text-text-soft resize-none"
          />
          <button
            onClick={handleExtractText}
            disabled={!text.trim() || extracting || needsKey}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3 text-sm font-semibold text-white active:scale-[0.98] transition disabled:opacity-40"
          >
            {extracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {extracting ? 'Leyendo receta…' : 'Extraer receta con IA'}
          </button>
        </div>
      )}

      {!draft && mode === 'url' && (
        <div className="flex flex-col gap-3 pb-4">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-2xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3.5 py-3 text-sm text-text placeholder:text-text-soft"
          />
          <button
            onClick={handleExtractUrl}
            disabled={!url.trim() || extracting || needsKey}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3 text-sm font-semibold text-white active:scale-[0.98] transition disabled:opacity-40"
          >
            {extracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {extracting ? 'Leyendo la página…' : 'Extraer receta con IA'}
          </button>
        </div>
      )}

      {!draft && mode === 'photo' && (
        <div className="flex flex-col gap-3 pb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={handlePhotoPick}
            className="hidden"
          />
          {photoPreview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-2xl overflow-hidden h-48 w-full"
            >
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-2/60 h-48 w-full text-text-muted"
            >
              <Camera size={22} />
              <span className="text-sm font-medium">Toca para elegir una foto</span>
            </button>
          )}
          <button
            onClick={handleExtractPhoto}
            disabled={!photoFile || extracting || needsKey}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3 text-sm font-semibold text-white active:scale-[0.98] transition disabled:opacity-40"
          >
            {extracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {extracting ? 'Leyendo la foto…' : 'Extraer receta con IA'}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 text-rose-600 p-3.5 mb-4 text-[13px] leading-relaxed">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {draft && (
        <>
          {mode !== 'manual' && (
            <p className="text-[12px] text-text-muted -mt-1 mb-3">
              Revisa y ajusta lo que haga falta antes de guardar — la IA puede haberse equivocado en algo.
            </p>
          )}
          <RecipeForm recipe={draft} onSave={handleSave} onCancel={mode !== 'manual' ? () => setDraft(null) : undefined} />
        </>
      )}
    </Sheet>
  )
}
