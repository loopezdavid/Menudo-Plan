import { useMemo, useState } from 'react'
import { Search, X, Trash2, BookOpen, Globe, Loader2 } from 'lucide-react'
import Sheet from '../ui/Sheet'
import Chip from '../ui/Chip'
import OnlineRecipeRow from '../recipes/OnlineRecipeRow'
import { RECIPES } from '../../data/recipes'
import { CATEGORY_TAGS } from '../../data/categoryTags'
import { filterRecipes } from '../../utils/recipeFilter'
import { useStore } from '../../store/useStore'
import { useOnlineRecipeSearch } from '../../hooks/useOnlineRecipeSearch'
import { getAnyRecipe } from '../../utils/recipeLookup'

export default function RecipePickerSheet({ open, onClose, weekKey, dayKey, slotKey, slotLabel, onViewRecipe }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(null)
  const weekPlan = useStore((s) => s.weekPlans[weekKey])
  const setMeal = useStore((s) => s.setMeal)
  const removeMeal = useStore((s) => s.removeMeal)
  const cacheExternalRecipe = useStore((s) => s.cacheExternalRecipe)
  const online = useOnlineRecipeSearch()

  const currentRecipeId = weekPlan?.[dayKey]?.[slotKey] || null
  const currentRecipe = currentRecipeId ? getAnyRecipe(currentRecipeId) : null

  const results = useMemo(
    () => filterRecipes(RECIPES, { query, category }),
    [query, category]
  )

  function handleSelect(recipeId) {
    setMeal(weekKey, dayKey, slotKey, recipeId)
    onClose()
  }

  function handleSelectOnline(recipe) {
    cacheExternalRecipe(recipe)
    handleSelect(recipe.id)
  }

  function handleViewOnline(recipe) {
    cacheExternalRecipe(recipe)
    onViewRecipe(recipe.id)
  }

  function handleRemove() {
    removeMeal(weekKey, dayKey, slotKey)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={slotLabel || 'Elegir plato'}>
      {currentRecipe && (
        <div className="flex items-center gap-3 rounded-2xl bg-primary-50 p-3 mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-600">Actual</p>
            <p className="text-sm font-semibold text-text truncate">{currentRecipe.name}</p>
          </div>
          <button
            onClick={() => onViewRecipe(currentRecipe.id)}
            className="shrink-0 flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-primary-600 active:scale-95 transition"
          >
            <BookOpen size={13} /> Ver
          </button>
          <button
            onClick={handleRemove}
            className="shrink-0 flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-rose-500 active:scale-95 transition"
          >
            <Trash2 size={13} /> Quitar
          </button>
        </div>
      )}

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar receta o ingrediente…"
          className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none pl-9 pr-8 py-2.5 text-sm text-text placeholder:text-text-soft"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-soft"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3 -mx-5 px-5">
        <Chip active={category === null} onClick={() => setCategory(null)} size="sm">
          Todas
        </Chip>
        {Object.entries(CATEGORY_TAGS).map(([id, meta]) => (
          <Chip key={id} color={meta.color} active={category === id} onClick={() => setCategory(id === category ? null : id)} size="sm">
            {meta.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-2 pb-3">
        {results.length === 0 && (
          <p className="text-center text-sm text-text-muted py-6">No hay recetas que coincidan en tu recetario.</p>
        )}
        {results.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => handleSelect(recipe.id)}
            className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-left active:scale-[0.98] transition ${
              recipe.id === currentRecipeId ? 'border-primary-400 bg-primary-50' : 'border-border bg-surface'
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">{recipe.name}</p>
              <p className="text-[11px] text-text-muted">
                {CATEGORY_TAGS[recipe.categories[0]]?.label} · {recipe.time} min · {recipe.kcal} kcal
              </p>
            </div>
          </button>
        ))}
      </div>

      {query.trim().length >= 3 && (
        <div className="pb-4 border-t border-border pt-3">
          <button
            onClick={() => online.search(query)}
            disabled={online.loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-2 py-2.5 text-[13px] font-semibold text-primary-600 active:scale-[0.98] transition disabled:opacity-60"
          >
            {online.loading ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
            {online.loading ? 'Buscando online…' : `Buscar "${query}" en bancos de recetas online`}
          </button>

          {online.hasSearched && !online.loading && (
            <div className="flex flex-col gap-2 mt-3">
              {online.results.length === 0 && (
                <p className="text-center text-xs text-text-muted py-4">Sin resultados online para esa búsqueda.</p>
              )}
              {online.results.map((recipe) => (
                <OnlineRecipeRow key={recipe.id} recipe={recipe} onSelect={handleSelectOnline} onView={handleViewOnline} />
              ))}
              {online.errors.length > 0 && (
                <p className="text-[11px] text-amber-600 px-1">
                  {online.errors.map((e) => `${e.source}: ${e.message}`).join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
