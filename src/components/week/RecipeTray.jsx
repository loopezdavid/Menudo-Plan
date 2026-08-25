import { useMemo, useState } from 'react'
import { Search, X, ChevronUp, ChevronDown, BookOpenText } from 'lucide-react'
import TrayRecipeCard from './TrayRecipeCard'
import Chip from '../ui/Chip'
import { RECIPES } from '../../data/recipes'
import { CATEGORY_TAGS } from '../../data/categoryTags'
import { filterRecipes } from '../../utils/recipeFilter'

export default function RecipeTray({ open, onToggleOpen, onView, onQuickAdd }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(null)

  const results = useMemo(() => filterRecipes(RECIPES, { query, category }), [query, category])

  const filters = (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
      <Chip active={category === null} onClick={() => setCategory(null)} size="sm">
        Todas
      </Chip>
      {Object.entries(CATEGORY_TAGS).map(([id, meta]) => (
        <Chip key={id} color={meta.color} active={category === id} onClick={() => setCategory(id === category ? null : id)} size="sm">
          {meta.label}
        </Chip>
      ))}
    </div>
  )

  const search = (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar receta…"
        className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none pl-8 pr-7 py-2 text-[12.5px] text-text placeholder:text-text-soft"
      />
      {query && (
        <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-soft">
          <X size={13} />
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* ---- Móvil: cajón inferior, no bloquea el calendario ---- */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-[64px] z-30 mx-auto w-full max-w-md transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-[calc(100%-44px)]'
        }`}
      >
        <div className="mx-3 rounded-t-3xl border border-border border-b-0 bg-surface/97 backdrop-blur-md shadow-pop overflow-hidden">
          <button
            onClick={onToggleOpen}
            className="flex w-full items-center justify-center gap-1.5 py-2.5 active:bg-surface-2 transition"
          >
            <BookOpenText size={14} className="text-primary-500" />
            <span className="text-[12.5px] font-semibold text-text">Recetario</span>
            <span className="text-[11px] text-text-muted">· arrastra al calendario</span>
            {open ? <ChevronDown size={15} className="text-text-soft ml-1" /> : <ChevronUp size={15} className="text-text-soft ml-1" />}
          </button>

          <div className="px-3 pb-3 flex flex-col gap-2" style={{ height: '36svh' }}>
            {search}
            {filters}
            <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-3 px-3">
              <div className="flex flex-col gap-2 pb-3">
                {results.map((recipe) => (
                  <TrayRecipeCard key={recipe.id} recipe={recipe} onView={onView} onQuickAdd={onQuickAdd} />
                ))}
                {results.length === 0 && (
                  <p className="text-center text-xs text-text-muted py-8">Sin resultados.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Escritorio: barra lateral fija ---- */}
      <aside className="hidden md:flex md:flex-col md:w-[280px] md:shrink-0 md:sticky md:top-[88px] md:self-start md:max-h-[calc(100svh-104px)] rounded-3xl border border-border bg-surface/80 backdrop-blur-sm p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <BookOpenText size={15} className="text-primary-500" />
          <h3 className="text-[13.5px] font-bold text-text">Recetario</h3>
        </div>
        <p className="text-[11.5px] text-text-muted -mt-2 mb-3">Arrastra una receta al calendario</p>
        <div className="flex flex-col gap-2 mb-3">
          {search}
          {filters}
        </div>
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          <div className="flex flex-col gap-2 pb-2">
            {results.map((recipe) => (
              <TrayRecipeCard key={recipe.id} recipe={recipe} onView={onView} onQuickAdd={onQuickAdd} />
            ))}
            {results.length === 0 && (
              <p className="text-center text-xs text-text-muted py-8">Sin resultados.</p>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
