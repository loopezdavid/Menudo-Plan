import { useState, useEffect } from 'react'
import { Clock, Flame, Drumstick, Minus, Plus, Heart, CalendarPlus, ChefHat, Download, ExternalLink, Pencil } from 'lucide-react'
import Sheet from '../ui/Sheet'
import Chip from '../ui/Chip'
import PrimaryButton from '../ui/PrimaryButton'
import RecipeImage from './RecipeImage'
import RecipeForm from './RecipeForm'
import AddToCalendarSheet from './AddToCalendarSheet'
import { getIngredient } from '../../data/ingredients'
import { CATEGORY_TAGS, METHOD_LABELS } from '../../data/categoryTags'
import { useStore } from '../../store/useStore'
import { printRecipe } from '../../utils/print'
import { getAnyRecipe } from '../../utils/recipeLookup'

function formatQty(qty, unit) {
  const rounded = Math.round(qty * 10) / 10
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} ${unit}`
}

// El catálogo local guarda los ingredientes por ingredientId (sin "name"
// propio, se resuelve al mostrarlo). Para poder editarlos en RecipeForm hace
// falta el nombre ya resuelto en cada ingrediente.
function withResolvedIngredientNames(recipe) {
  return {
    ...recipe,
    ingredients: (recipe.ingredients || []).map((item) => ({
      ...item,
      name: item.ingredientId ? getIngredient(item.ingredientId)?.name || item.name || '' : item.name || '',
    })),
  }
}

export default function RecipeDetailSheet({ recipeId, open, onClose }) {
  const [editOpen, setEditOpen] = useState(false)
  const recipe = recipeId ? getAnyRecipe(recipeId) : null
  const [servings, setServings] = useState(2)
  const [addOpen, setAddOpen] = useState(false)
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const cacheExternalRecipe = useStore((s) => s.cacheExternalRecipe)

  useEffect(() => {
    if (recipe) setServings(recipe.servings || 4)
  }, [recipe])

  if (!recipe) return null
  const scale = servings / (recipe.servings || 4)
  const isFav = favorites.includes(recipe.id)
  const primaryTag = CATEGORY_TAGS[recipe.categories[0]]
  const isExternal = recipe.source && recipe.source !== 'local'

  // Editar guarda siempre un override con el MISMO id en externalRecipes
  // (getAnyRecipe le da prioridad sobre el catálogo local — ver recipeLookup.js),
  // así que sustituye a la receta de verdad en vez de crear una copia aparte:
  // el calendario, favoritos y la lista de la compra siguen apuntando al mismo id.
  function handleEditSave(updated) {
    cacheExternalRecipe(updated)
    setEditOpen(false)
  }

  function handleClose() {
    setEditOpen(false)
    onClose()
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={handleClose}
        title={editOpen ? 'Editar receta' : undefined}
        footer={
          !editOpen && (
            <PrimaryButton
              onClick={() => setAddOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3.5 text-[15px] font-semibold text-white transition-colors shadow-sm"
            >
              <CalendarPlus size={18} />
              Añadir al calendario
            </PrimaryButton>
          )
        }
      >
        {editOpen ? (
          <>
            <RecipeForm
              recipe={withResolvedIngredientNames(recipe)}
              onSave={handleEditSave}
              onCancel={() => setEditOpen(false)}
            />
          </>
        ) : (
          <>
        <div className="-mx-5 -mt-1 mb-4">
          <RecipeImage recipeId={recipe.id} categories={recipe.categories} imageUrl={recipe.image} className="w-full h-48" iconSize={38} />
        </div>

        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex flex-wrap gap-1.5">
            {recipe.categories.map((tag) => (
              <Chip key={tag} color={CATEGORY_TAGS[tag]?.color} size="sm">
                {CATEGORY_TAGS[tag]?.label}
              </Chip>
            ))}
            {isExternal && recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-muted"
              >
                {recipe.sourceLabel} <ExternalLink size={11} />
              </a>
            )}
            {isExternal && !recipe.sourceUrl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-muted">
                {recipe.sourceLabel}
              </span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center active:scale-90 transition"
              aria-label="Editar receta"
              title="Editar receta"
            >
              <Pencil size={15} className="text-text-muted" />
            </button>
            <button
              onClick={() => printRecipe(recipe.id, servings)}
              className="h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center active:scale-90 transition"
              aria-label="Descargar receta"
              title="Descargar receta"
            >
              <Download size={16} className="text-text-muted" />
            </button>
            <button
              onClick={() => toggleFavorite(recipe.id)}
              className="h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center active:scale-90 transition"
              aria-label="Favorito"
            >
              <Heart size={17} className={isFav ? 'fill-rose-500 text-rose-500' : 'text-text-muted'} />
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-text mb-3 leading-snug">{recipe.name}</h2>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {recipe.time && <StatBox icon={Clock} label="Tiempo" value={`${recipe.time} min`} />}
          {recipe.difficulty && <StatBox icon={ChefHat} label="Dificultad" value={recipe.difficulty} />}
          {recipe.kcal && <StatBox icon={Flame} label="Kcal / pers." value={recipe.kcal} />}
          {recipe.protein && <StatBox icon={Drumstick} label="Proteína" value={`${recipe.protein} g`} />}
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 mb-6">
          <div>
            <p className="text-sm font-semibold text-text">Raciones</p>
            <p className="text-xs text-text-muted">Ajusta las cantidades</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center active:scale-90 transition"
            >
              <Minus size={15} />
            </button>
            <span className="w-5 text-center font-semibold tabular-nums">{servings}</span>
            <button
              onClick={() => setServings((s) => Math.min(8, s + 1))}
              className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center active:scale-90 transition"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        <section className="mb-6">
          <h3 className="text-[15px] font-semibold text-text mb-2.5">Ingredientes</h3>
          <ul className="flex flex-col gap-2">
            {recipe.ingredients.map((item, i) => {
              const name = item.ingredientId ? getIngredient(item.ingredientId).name : item.name
              return (
                <li
                  key={item.ingredientId || `${item.name}-${i}`}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-border/70 last:border-0"
                >
                  <span className="text-text">{name}</span>
                  <span className="text-text-muted font-medium tabular-nums">
                    {formatQty(item.quantity * scale, item.unit)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <h3 className="text-[15px] font-semibold text-text">Preparación</h3>
            {recipe.method && (
              <Chip color={primaryTag?.color} size="sm">
                {METHOD_LABELS[recipe.method]}
              </Chip>
            )}
          </div>
          {recipe.steps?.length ? (
            <ol className="flex flex-col gap-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-text leading-relaxed">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-2xl bg-surface-2 p-4 text-sm text-text-muted">
              {recipe.sourceUrl ? (
                <>
                  Esta receta viene de {recipe.sourceLabel} y no incluye los pasos aquí.{' '}
                  <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary-600 underline">
                    Ver receta completa ↗
                  </a>
                </>
              ) : (
                'Esta receta no tiene pasos de preparación todavía.'
              )}
            </div>
          )}
        </section>
          </>
        )}
      </Sheet>

      <AddToCalendarSheet open={addOpen} onClose={() => setAddOpen(false)} recipeId={recipe.id} />
    </>
  )
}

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-surface-2 py-2.5 px-1 text-center">
      <Icon size={15} className="text-primary-500" />
      <span className="text-[13px] font-bold text-text leading-none">{value}</span>
      <span className="text-[10px] text-text-muted leading-none">{label}</span>
    </div>
  )
}
