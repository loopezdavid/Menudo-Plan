import { useState } from 'react'
import { Copy, Trash2, Shuffle, ChevronRight } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { useStore } from '../../store/useStore'
import { addWeeks, weekKey as toWeekKey, formatWeekRange } from '../../utils/date'

export default function WeekActionsSheet({ open, onClose, weekKey }) {
  const [confirming, setConfirming] = useState(null) // 'clear' | 'generate' | null
  const clearWeek = useStore((s) => s.clearWeek)
  const generateRandomWeek = useStore((s) => s.generateRandomWeek)
  const duplicateWeek = useStore((s) => s.duplicateWeek)
  const goToWeek = useStore((s) => s.goToWeek)

  function reset() {
    setConfirming(null)
    onClose()
  }

  function handleDuplicate() {
    const nextKey = toWeekKey(addWeeks(weekKey, 1))
    duplicateWeek(weekKey, nextKey)
    goToWeek(nextKey)
    reset()
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
          <button
            onClick={() => {
              if (confirming === 'clear') clearWeek(weekKey)
              else generateRandomWeek(weekKey)
              reset()
            }}
            className="flex-1 rounded-2xl bg-primary-500 py-3 text-sm font-semibold text-white active:scale-[0.98] transition"
          >
            Confirmar
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={reset} title="Acciones de la semana">
      <div className="flex flex-col gap-2 pb-4">
        <ActionRow
          icon={Copy}
          title="Duplicar semana"
          subtitle={`Copiar a la semana del ${formatWeekRange(addWeeks(weekKey, 1))}`}
          onClick={handleDuplicate}
        />
        <ActionRow
          icon={Shuffle}
          title="Generar nueva semana"
          subtitle="Rellena los huecos con recetas aleatorias"
          onClick={() => setConfirming('generate')}
        />
        <ActionRow
          icon={Trash2}
          title="Vaciar semana"
          subtitle="Elimina todos los platos planificados"
          danger
          onClick={() => setConfirming('clear')}
        />
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
