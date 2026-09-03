import { useDraggable } from '@dnd-kit/core'
import { Clock, CalendarPlus } from 'lucide-react'
import RecipeImage from '../recipes/RecipeImage'

export default function TrayRecipeCard({ recipe, onView, onQuickAdd }) {
  const dragId = `recipe:${recipe.id}`
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { type: 'recipe', recipeId: recipe.id },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.3 : 1,
      }}
      onClick={() => onView(recipe.id)}
      className="group flex w-full items-center gap-2.5 cursor-grab active:cursor-grabbing touch-none rounded-2xl bg-surface border border-border shadow-card overflow-hidden p-2"
    >
      <RecipeImage
        recipeId={recipe.id}
        categories={recipe.categories}
        imageUrl={recipe.image}
        className="h-12 w-12 shrink-0 rounded-xl"
        iconSize={16}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-text leading-snug line-clamp-2">{recipe.name}</p>
        {recipe.time && (
          <span className="flex items-center gap-1 text-[10.5px] text-text-muted mt-0.5">
            <Clock size={11} /> {recipe.time} min
          </span>
        )}
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(recipe.id)
        }}
        className="h-7 w-7 shrink-0 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center active:scale-90 transition touch-none"
        aria-label="Añadir al calendario"
      >
        <CalendarPlus size={13} />
      </button>
    </div>
  )
}
