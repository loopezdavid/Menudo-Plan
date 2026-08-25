import RecipeImage from './RecipeImage'

export default function OnlineRecipeRow({ recipe, onSelect, onView }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2 text-left">
      <button onClick={() => onView(recipe)} className="shrink-0">
        <RecipeImage recipeId={recipe.id} categories={recipe.categories} imageUrl={recipe.image} className="h-12 w-12 rounded-xl" iconSize={16} />
      </button>
      <button onClick={() => onView(recipe)} className="min-w-0 flex-1 text-left">
        <p className="text-sm font-semibold text-text truncate">{recipe.name}</p>
        <p className="text-[11px] text-text-muted flex items-center gap-1">
          <span className="font-medium text-primary-600">{recipe.sourceLabel}</span>
          {recipe.time && <span>· {recipe.time} min</span>}
          {recipe.kcal && <span>· {recipe.kcal} kcal</span>}
        </p>
      </button>
      <button
        onClick={() => onSelect(recipe)}
        className="shrink-0 rounded-full bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white active:scale-95 transition"
      >
        Añadir
      </button>
    </div>
  )
}
