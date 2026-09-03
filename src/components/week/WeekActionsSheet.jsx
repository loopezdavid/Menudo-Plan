import { useState } from 'react'
import { Copy, Trash2, Shuffle, ChevronRight, Share2, BookmarkPlus, LayoutTemplate, Sparkles, Loader2, AlertTriangle } from 'lucide-react'
import Sheet from '../ui/Sheet'
import PrimaryButton from '../ui/PrimaryButton'
import { useStore } from '../../store/useStore'
import { addWeeks, weekKey as toWeekKey, formatWeekRange } from '../../utils/date'
import { buildWeekShareText, shareOrCopyText } from '../../utils/shareWeek'
import { generateWeekWithAI, getAiConfig, AI_ENGINES } from '../../services/aiRecipeImport'
import { RECIPES } from '../../data/recipes'

export default function WeekActionsSheet({ open, onClose, weekKey }) {
  const [confirming, setConfirming] = useState(null) // 'clear' | 'generate' | null
  const [view, setView] = useState(null) // null | 'saveTemplate' | 'templates' | 'aiGenerate'
  const [templateName, setTemplateName] = useState('')
  const [aiConstraints, setAiConstraints] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState(null)

  const clearWeek = useStore((s) => s.clearWeek)
  const generateRandomWeek = useStore((s) => s.generateRandomWeek)
  const duplicateWeek = useStore((s) => s.duplicateWeek)
  const goToWeek = useStore((s) => s.goToWeek)
  const weekPlans = useStore((s) => s.weekPlans)
  const weekTemplates = useStore((s) => s.weekTemplates)
  const saveWeekTemplate = useStore((s) => s.saveWeekTemplate)
  const applyWeekTemplate = useStore((s) => s.applyWeekTemplate)
  const deleteWeekTemplate = useStore((s) => s.deleteWeekTemplate)
  const applyWeekAssignments = useStore((s) => s.applyWeekAssignments)
  const externalRecipes = useStore((s) => s.externalRecipes)
  const settings = useStore((s) => s.settings)

  function reset() {
    setConfirming(null)
    setView(null)
    setTemplateName('')
    setAiConstraints('')
    setAiError(null)
    onClose()
  }

  function handleDuplicate() {
    const nextKey = toWeekKey(addWeeks(weekKey, 1))
    duplicateWeek(weekKey, nextKey)
    goToWeek(nextKey)
    reset()
  }

  function handleShareText() {
    const plan = weekPlans[weekKey] || {}
    shareOrCopyText('Menú semanal', buildWeekShareText(weekKey, plan)).catch(() => {})
  }

  function handleSaveTemplate() {
    if (!templateName.trim()) return
    saveWeekTemplate(templateName, weekKey)
    reset()
  }

  function handleApplyTemplate(id) {
    applyWeekTemplate(id, weekKey)
    reset()
  }

  async function handleGenerateWithAI() {
    setAiBusy(true)
    setAiError(null)
    try {
      const myRecipes = Object.values(externalRecipes).filter((r) => r.source === 'custom' || r.source === 'ai')
      const availableRecipes = [...RECIPES, ...myRecipes]
      const aiConfig = getAiConfig(settings)
      const assignments = await generateWeekWithAI({ constraints: aiConstraints, availableRecipes, aiConfig })
      applyWeekAssignments(weekKey, assignments)
      reset()
    } catch (err) {
      setAiError(err.message || 'No se pudo generar la semana.')
    } finally {
      setAiBusy(false)
    }
  }

  if (confirming) {
    const copy =
      confirming === 'clear'
        ? { title: 'Vaciar la semana', body: 'Se eliminarán todos los platos de esta semana. Esta acción no se puede deshacer.' }
        : { title: 'Generar nueva semana', body: 'Se sustituirán los platos actuales por una combinación aleatoria del recetario.' }
    return (
      <Sheet open={open} onClose={reset} title={copy.title}>
        <p className="text-sm text-text-muted mb-5">{copy.body}</p>
        <div className="flex gap-2 pb-4">
          <button
            onClick={reset}
            className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-text-muted active:scale-[0.98] transition"
          >
            Cancelar
          </button>
          <PrimaryButton
            onClick={() => {
              if (confirming === 'clear') clearWeek(weekKey)
              else generateRandomWeek(weekKey)
              reset()
            }}
            className="flex-1 rounded-2xl bg-primary-500 py-3 text-sm font-semibold text-white transition-colors"
          >
            Confirmar
          </PrimaryButton>
        </div>
      </Sheet>
    )
  }

  if (view === 'saveTemplate') {
    return (
      <Sheet open={open} onClose={reset} title="Guardar como plantilla">
        <p className="text-sm text-text-muted mb-4">
          Guarda el menú de esta semana para poder aplicarlo a cualquier otra semana más adelante.
        </p>
        <input
          autoFocus
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="p. ej. Semana ligera"
          className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3.5 py-2.5 text-sm text-text placeholder:text-text-soft mb-4"
        />
        <div className="flex gap-2 pb-4">
          <button onClick={() => setView(null)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-text-muted active:scale-[0.98] transition">
            Cancelar
          </button>
          <PrimaryButton
            onClick={handleSaveTemplate}
            disabled={!templateName.trim()}
            className="flex-1 rounded-2xl bg-primary-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
          >
            Guardar
          </PrimaryButton>
        </div>
      </Sheet>
    )
  }

  if (view === 'templates') {
    return (
      <Sheet open={open} onClose={reset} title="Tus plantillas">
        {weekTemplates.length === 0 && (
          <p className="text-sm text-text-muted py-8 text-center">Todavía no has guardado ninguna plantilla.</p>
        )}
        <div className="flex flex-col gap-2 pb-4">
          {weekTemplates.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-3.5">
              <button onClick={() => handleApplyTemplate(t.id)} className="min-w-0 flex-1 text-left active:opacity-70 transition">
                <p className="text-sm font-semibold text-text truncate">{t.name}</p>
                <p className="text-[11px] text-text-muted">Toca para aplicarla a esta semana</p>
              </button>
              <button
                onClick={() => deleteWeekTemplate(t.id)}
                className="h-8 w-8 shrink-0 rounded-full bg-surface-2 flex items-center justify-center active:scale-90 transition"
                aria-label="Eliminar plantilla"
              >
                <Trash2 size={14} className="text-rose-500" />
              </button>
            </div>
          ))}
        </div>
      </Sheet>
    )
  }

  if (view === 'aiGenerate') {
    const engineLabel = AI_ENGINES[settings.aiEngine]?.label || settings.aiEngine
    return (
      <Sheet open={open} onClose={reset} title="Generar semana con IA">
        <div className="flex items-center gap-1.5 mb-3 -mt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-muted">
            <Sparkles size={11} /> {engineLabel}
          </span>
        </div>
        <p className="text-sm text-text-muted mb-3">
          Elige entre las recetas de tu recetario para rellenar los huecos vacíos de esta semana, variando lo
          máximo posible. Puedes darle alguna indicación:
        </p>
        <textarea
          value={aiConstraints}
          onChange={(e) => setAiConstraints(e.target.value)}
          rows={3}
          placeholder="p. ej. sin marisco, algo de legumbres al menos 2 veces, nada muy pesado entre semana…"
          className="w-full rounded-2xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3.5 py-3 text-sm text-text placeholder:text-text-soft resize-none mb-3"
        />
        {aiError && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 text-rose-600 p-3.5 mb-3 text-[13px] leading-relaxed">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}
        <div className="flex gap-2 pb-4">
          <button onClick={() => setView(null)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-text-muted active:scale-[0.98] transition">
            Cancelar
          </button>
          <PrimaryButton
            onClick={handleGenerateWithAI}
            disabled={aiBusy}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
          >
            {aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {aiBusy ? 'Generando…' : 'Generar semana'}
          </PrimaryButton>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={reset} title="Acciones de la semana">
      <div className="flex flex-col gap-2 pb-4">
        <ActionRow icon={Sparkles} title="Generar semana con IA" subtitle="Rellena los huecos según tus preferencias" onClick={() => setView('aiGenerate')} />
        <ActionRow icon={Shuffle} title="Generar nueva semana" subtitle="Rellena los huecos con recetas aleatorias" onClick={() => setConfirming('generate')} />
        <ActionRow icon={Copy} title="Duplicar semana" subtitle={`Copiar a la semana del ${formatWeekRange(addWeeks(weekKey, 1))}`} onClick={handleDuplicate} />
        <ActionRow icon={BookmarkPlus} title="Guardar como plantilla" subtitle="Para reutilizar este menú más adelante" onClick={() => setView('saveTemplate')} />
        <ActionRow icon={LayoutTemplate} title="Cargar plantilla" subtitle={`${weekTemplates.length} guardada${weekTemplates.length === 1 ? '' : 's'}`} onClick={() => setView('templates')} />
        <ActionRow icon={Share2} title="Compartir semana (texto)" subtitle="Por WhatsApp, notas, lo que uses" onClick={handleShareText} />
        <ActionRow icon={Trash2} title="Vaciar semana" subtitle="Elimina todos los platos planificados" danger onClick={() => setConfirming('clear')} />
      </div>
    </Sheet>
  )
}

function ActionRow({ icon: Icon, title, subtitle, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-left active:scale-[0.98] transition"
    >
      <span
        className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${
          danger ? 'bg-rose-50 text-rose-500' : 'bg-primary-50 text-primary-600'
        }`}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${danger ? 'text-rose-500' : 'text-text'}`}>{title}</p>
        <p className="text-[12px] text-text-muted truncate">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-text-soft shrink-0" />
    </button>
  )
}
