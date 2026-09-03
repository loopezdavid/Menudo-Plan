import { useDraggable } from '@dnd-kit/core'
import { X, GripVertical } from 'lucide-react'
import { getAnyRecipe } from '../../utils/recipeLookup'
import RecipeImage from '../recipes/RecipeImage'

export default function PlacedMealCard({ dayKey, slotKey, recipeId, onView, onRemove }) {
  const recipe = getAnyRecipe(recipeId)
  const dragId = `placed:${dayKey}:${slotKey}`
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { type: 'placed', dayKey, slotKey, recipeId },
  })

  if (!recipe) return null

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onView(recipe.id)}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="group relative w-full rounded-xl overflow-hidden shadow-card min-h-[72px] touch-none select-none cursor-grab active:cursor-grabbing"
    >
      <RecipeImage recipeId={recipe.id} categories={recipe.categories} imageUrl={recipe.image} className="absolute inset-0 h-full w-full" iconSize={18} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      <span className="relative z-10 flex h-full w-full flex-col justify-end items-start p-2 pr-6">
        <span className="block text-[11.5px] font-semibold text-white leading-snug line-clamp-2 drop-shadow-sm">
          {recipe.name}
        </span>
      </span>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute top-1.5 right-1.5 z-20 h-7 w-7 rounded-full bg-black/35 text-white flex items-center justify-center active:scale-90 transition backdrop-blur-sm touch-none"
        aria-label="Quitar plato"
      >
        <X size={13} />
      </button>

      <span className="absolute bottom-1 right-1.5 h-5 w-5 rounded-full text-white/70 flex items-center justify-center pointer-events-none">
        <GripVertical size={13} />
      </span>
    </div>
  )
}
