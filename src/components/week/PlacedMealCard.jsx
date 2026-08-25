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
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="group relative w-full rounded-xl overflow-hidden shadow-card min-h-[72px] touch-none"
    >
      <RecipeImage recipeId={recipe.id} categories={recipe.categories} imageUrl={recipe.image} className="absolute inset-0 h-full w-full" iconSize={18} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      <button type="button" onClick={() => onView(recipe.id)} className="relative z-10 flex h-full w-full flex-col justify-end items-start p-2 pr-6 text-left">
        <span className="block text-[11.5px] font-semibold text-white leading-snug line-clamp-2 drop-shadow-sm">
          {recipe.name}
        </span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/35 text-white flex items-center justify-center active:scale-90 transition backdrop-blur-sm"
        aria-label="Quitar plato"
      >
        <X size={12} />
      </button>

      <span
        {...attributes}
        {...listeners}
        className="absolute bottom-1 right-1.5 z-10 h-5 w-5 rounded-full text-white/80 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        aria-label="Arrastrar"
      >
        <GripVertical size={13} />
      </span>
    </div>
  )
}
