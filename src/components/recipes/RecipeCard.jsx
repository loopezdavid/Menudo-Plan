import { Clock, Flame, Heart, CalendarPlus, BookOpen } from 'lucide-react'
import Chip from '../ui/Chip'
import RecipeImage from './RecipeImage'
import { CATEGORY_TAGS, METHOD_LABELS } from '../../data/categoryTags'
import { useStore } from '../../store/useStore'

export default function RecipeCard({ recipe, onView, onQuickAdd }) {
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const isFav = favorites.includes(recipe.id)

  return (
    <div className="flex flex-col rounded-2xl bg-surface border border-border shadow-card overflow-hidden relative group">
      <button
        onClick={() => toggleFavorite(recipe.id)}
        className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center z-10 active:scale-90 transition shadow-sm"
        aria-label="Favorito"
      >
        <Heart size={14} className={isFav ? 'fill-rose-500 text-rose-500' : 'text-text-muted'} />
      </button>

      <button onClick={() => onView(recipe.id)} className="text-left flex flex-col active:opacity-90 transition">
        <div className="relative">
          <RecipeImage
            recipeId={recipe.id}
            categories={recipe.categories}
            imageUrl={recipe.image}
            className="w-full aspect-[4/3] transition-transform duration-300 group-hover:scale-105"
            iconSize={30}
          />
          {recipe.source && recipe.source !== 'local' && (
            <span className="absolute bottom-2 left-2 rounded-full bg-black/55 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
              {recipe.sourceLabel}
            </span>
          )}
        </div>

        <div className="flex flex-col p-3.5 pb-1">
          <div className="flex flex-wrap gap-1 mb-2">
            {recipe.categories.slice(0, 2).map((tag) => (
              <Chip key={tag} color={CATEGORY_TAGS[tag]?.color} size="sm">
                {CATEGORY_TAGS[tag]?.label}
              </Chip>
            ))}
          </div>

          <h3 className="text-[14.5px] font-bold text-text leading-snug mb-1.5 line-clamp-2 min-h-[38px]">
            {recipe.name}
          </h3>

          <div className="flex items-center gap-2.5 text-[11.5px] text-text-muted mb-0.5">
            {recipe.time && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {recipe.time} min
              </span>
            )}
            {recipe.kcal && (
              <span className="flex items-center gap-1">
                <Flame size={12} /> {recipe.kcal} kcal
              </span>
            )}
          </div>
          {recipe.method && (
            <p className="text-[11px] text-text-soft mb-2.5">{METHOD_LABELS[recipe.method]} · {recipe.difficulty}</p>
          )}
        </div>
      </button>

      <div className="mt-auto flex gap-1.5 p-3.5 pt-1">
        <button
          onClick={() => onView(recipe.id)}
          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-surface-2 py-2 text-[12px] font-semibold text-text active:scale-95 transition"
        >
          <BookOpen size={13} /> Ver
        </button>
        <button
          onClick={() => onQuickAdd(recipe.id)}
          className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-primary-500 py-2 text-[12px] font-semibold text-white active:scale-95 transition"
        >
          <CalendarPlus size={13} /> Añadir
        </button>
      </div>
    </div>
  )
}
