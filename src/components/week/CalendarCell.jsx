import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import PlacedMealCard from './PlacedMealCard'

export default function CalendarCell({ dayKey, slotKey, recipeId, onPick, onView, onRemove }) {
  const dropId = `slot:${dayKey}:${slotKey}`
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { dayKey, slotKey },
  })

  if (recipeId) {
    return (
      <div ref={setNodeRef} className={`rounded-xl transition ${isOver ? 'ring-2 ring-primary-400 ring-offset-1 ring-offset-bg' : ''}`}>
        <PlacedMealCard
          dayKey={dayKey}
          slotKey={slotKey}
          recipeId={recipeId}
          onView={onView}
          onRemove={() => onRemove(dayKey, slotKey)}
        />
      </div>
    )
  }

  return (
    <button
      ref={setNodeRef}
      onClick={() => onPick(dayKey, slotKey)}
      className={`flex w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed px-2 py-2.5 text-center transition min-h-[72px] ${
        isOver
          ? 'border-primary-400 bg-primary-50 scale-[1.02]'
          : 'border-border bg-surface-2/60 hover:border-primary-200 hover:bg-primary-50/40'
      }`}
    >
      <Plus size={14} className={isOver ? 'text-primary-500' : 'text-text-soft'} />
      <span className={`text-[10px] font-medium hidden sm:block ${isOver ? 'text-primary-600' : 'text-text-soft'}`}>
        {isOver ? 'Soltar aquí' : 'Añadir'}
      </span>
    </button>
  )
}
