import { useMemo, useState } from 'react'
import { Search, X, Heart, Globe, Loader2, Plus } from 'lucide-react'
import RecipeCard from './RecipeCard'
import RecipeDetailSheet from './RecipeDetailSheet'
import AddToCalendarSheet from './AddToCalendarSheet'
import RecipeImage from './RecipeImage'
import ImportRecipeSheet from './ImportRecipeSheet'
import Chip from '../ui/Chip'
import { RECIPES } from '../../data/recipes'
import { CATEGORY_TAGS } from '../../data/categoryTags'
import { filterRecipes } from '../../utils/recipeFilter'
import { useStore } from '../../store/useStore'
import { useOnlineRecipeSearch } from '../../hooks/useOnlineRecipeSearch'
import { getAnyRecipe } from '../../utils/recipeLookup'

export default function RecipesView() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(null)
  const [favOnly, setFavOnly] = useState(false)
  const [viewingId, setViewingId] = useState(null)
  const [addingId, setAddingId] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  const favorites = useStore((s) => s.favorites)
  const recentRecipeIds = useStore((s) => s.recentRecipeIds)
  const cacheExternalRecipe = useStore((s) => s.cacheExternalRecipe)
  const externalRecipes = useStore((s) => s.externalRecipes)
  const online = useOnlineRecipeSearch()

  const myRecipes = useMemo(
    () => Object.values(externalRecipes).filter((r) => r.source === 'custom' || r.source === 'ai'),
    [externalRecipes]
  )

  const results = useMemo(() => {
    let list = filterRecipes([...myRecipes, ...RECIPES], { query, category })
    if (favOnly) list = list.filter((r) => favorites.includes(r.id))
    return list
  }, [query, category, favOnly, favorites, myRecipes])

  function handleViewOnline(id) {
    const recipe = online.results.find((r) => r.id === id)
    if (recipe) cacheExternalRecipe(recipe)
    setViewingId(id)
  }

  function handleQuickAddOnline(id) {
    const recipe = online.results.find((r) => r.id === id)
    if (recipe) cacheExternalRecipe(recipe)
    setAddingId(id)
  }

  const recentRecipes = recentRecipeIds.map(getAnyRecipe).filter(Boolean).slice(0, 8)
  const showRecent = !query && !category && !favOnly && recentRecipes.length > 0

  return (
    <div className="px-5 pt-1">
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar receta o ingrediente…"
            className="w-full rounded-2xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none pl-10 pr-9 py-3 text-sm text-text placeholder:text-text-soft"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-soft">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setImportOpen(true)}
          className="shrink-0 flex items-center gap-1.5 rounded-2xl bg-primary-500 px-4 py-3 text-[13px] font-semibold text-white active:scale-[0.98] transition"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Importar receta</span>
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-3 -mx-5 px-5">
        <Chip active={favOnly} onClick={() => setFavOnly((v) => !v)} size="sm" color="primary">
          <Heart size={12} className={favOnly ? 'fill-white' : ''} /> Favoritas
        </Chip>
        <Chip active={category === null} onClick={() => setCategory(null)} size="sm">
          Todas
        </Chip>
        {Object.entries(CATEGORY_TAGS).map(([id, meta]) => (
          <Chip
            key={id}
            color={meta.color}
            active={category === id}
            onClick={() => setCategory(id === category ? null : id)}
            size="sm"
          >
            {meta.label}
          </Chip>
        ))}
      </div>

      {showRecent && (
        <div className="mb-4">
          <p className="text-[13px] font-semibold text-text-muted mb-2 mt-1">Usadas recientemente</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
            {recentRecipes.map((r) => (
              <button
                key={r.id}
                onClick={() => setViewingId(r.id)}
                className="shrink-0 w-40 flex items-center gap-2.5 rounded-2xl bg-surface border border-border p-2 text-left active:scale-95 transition"
              >
                <RecipeImage recipeId={r.id} categories={r.categories} imageUrl={r.image} className="h-11 w-11 shrink-0 rounded-xl" iconSize={15} />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-text line-clamp-2 leading-snug">{r.name}</p>
                  <p className="text-[10.5px] text-text-muted mt-0.5">
                    {r.time ? `${r.time} min` : r.sourceLabel}
                    {r.kcal ? ` · ${r.kcal} kcal` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[13px] text-text-muted mb-3">{results.length} receta{results.length === 1 ? '' : 's'}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-6">
        {results.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onView={setViewingId} onQuickAdd={setAddingId} />
        ))}
        {results.length === 0 && (
          <p className="col-span-full text-center text-sm text-text-muted py-12">
            No hay recetas que coincidan con tu búsqueda.
          </p>
        )}
      </div>

      {query.trim().length >= 3 && (
        <div className="pb-6 border-t border-border pt-4">
          <button
            onClick={() => online.search(query)}
            disabled={online.loading}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-[13.5px] font-semibold text-primary-600 active:scale-[0.98] transition disabled:opacity-60"
          >
            {online.loading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
            {online.loading ? 'Buscando en bancos de recetas online…' : `Buscar "${query}" en bancos de recetas online`}
          </button>

          {online.hasSearched && !online.loading && (
            <>
              <p className="text-[13px] text-text-muted mt-4 mb-3">
                {online.results.length} resultado{online.results.length === 1 ? '' : 's'} online
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {online.results.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} onView={handleViewOnline} onQuickAdd={handleQuickAddOnline} />
                ))}
              </div>
              {online.errors.length > 0 && (
                <p className="text-[11px] text-amber-600 mt-3">
                  {online.errors.map((e) => `${e.source}: ${e.message}`).join(' · ')}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <RecipeDetailSheet recipeId={viewingId} open={!!viewingId} onClose={() => setViewingId(null)} />
      <AddToCalendarSheet open={!!addingId} onClose={() => setAddingId(null)} recipeId={addingId} />
      <ImportRecipeSheet
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSaved={(id) => setViewingId(id)}
      />
    </div>
  )
}
