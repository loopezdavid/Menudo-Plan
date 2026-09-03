import { useState } from 'react'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { MoreHorizontal, Download, Share2, Loader2 } from 'lucide-react'
import CalendarGrid from './CalendarGrid'
import RecipeTray from './RecipeTray'
import WeekNav from './WeekNav'
import WeekStats from './WeekStats'
import WeekNutritionSummary from './WeekNutritionSummary'
import WeekActionsSheet from './WeekActionsSheet'
import RecipePickerSheet from './RecipePickerSheet'
import AddToCalendarSheet from '../recipes/AddToCalendarSheet'
import RecipeDetailSheet from '../recipes/RecipeDetailSheet'
import { SLOTS, emptyWeek } from '../../data/initialWeekPlan'
import { useStore, weekStatsForKey } from '../../store/useStore'
import { getWeekStart } from '../../utils/date'
import { getAnyRecipe } from '../../utils/recipeLookup'
import { CATEGORY_TAGS } from '../../data/categoryTags'
import { printWeek } from '../../utils/print'
import { buildWeekPosterBlob, shareOrDownloadPoster } from '../../utils/shareWeekImage'

const SLOT_LABELS = Object.fromEntries(SLOTS.map((s) => [s.key, s.group ? `${s.group} · ${s.label}` : s.label]))

function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function CalendarBoard() {
  const activeWeekKey = useStore((s) => s.activeWeekKey)
  const weekPlans = useStore((s) => s.weekPlans)
  const goToNextWeek = useStore((s) => s.goToNextWeek)
  const goToPrevWeek = useStore((s) => s.goToPrevWeek)
  const goToCurrentWeek = useStore((s) => s.goToCurrentWeek)
  const setMeal = useStore((s) => s.setMeal)
  const removeMeal = useStore((s) => s.removeMeal)
  const peopleCount = useStore((s) => s.settings.peopleCount)

  const [picker, setPicker] = useState(null) // { dayKey, slotKey }
  const [actionsOpen, setActionsOpen] = useState(false)
  const [viewingRecipeId, setViewingRecipeId] = useState(null)
  const [quickAddId, setQuickAddId] = useState(null)
  const [trayOpen, setTrayOpen] = useState(false)
  const [activeDrag, setActiveDrag] = useState(null)
  const [sharingImage, setSharingImage] = useState(false)

  const plan = weekPlans[activeWeekKey] || emptyWeek()
  const weekStart = getWeekStart(activeWeekKey)
  const stats = weekStatsForKey(activeWeekKey, weekPlans, getAnyRecipe)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function handleDragStart(event) {
    setActiveDrag(event.active.data.current)
  }

  function handleDragEnd(event) {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return
    const activeData = active.data.current
    const overData = over.data.current
    if (!activeData || !overData) return
    const { dayKey: toDay, slotKey: toSlot } = overData

    if (activeData.type === 'recipe') {
      setMeal(activeWeekKey, toDay, toSlot, activeData.recipeId)
      setTrayOpen(false)
    } else if (activeData.type === 'placed') {
      const { dayKey: fromDay, slotKey: fromSlot, recipeId } = activeData
      if (fromDay === toDay && fromSlot === toSlot) return
      const targetRecipeId = plan[toDay]?.[toSlot] || null
      setMeal(activeWeekKey, toDay, toSlot, recipeId)
      if (targetRecipeId) {
        setMeal(activeWeekKey, fromDay, fromSlot, targetRecipeId)
      } else {
        removeMeal(activeWeekKey, fromDay, fromSlot)
      }
    }
  }

  function handleDownloadWeek() {
    printWeek({ weekKey: activeWeekKey, plan, peopleCount })
  }

  async function handleShareImage() {
    if (sharingImage) return
    setSharingImage(true)
    try {
      const blob = await buildWeekPosterBlob({ weekKey: activeWeekKey, plan })
      await shareOrDownloadPoster(blob, `menu-semanal-${activeWeekKey}.png`)
    } catch (err) {
      console.warn('No se pudo generar la imagen de la semana.', err)
    } finally {
      setSharingImage(false)
    }
  }

  const dragRecipe = activeDrag?.recipeId ? getAnyRecipe(activeDrag.recipeId) : null
  const dragTag = dragRecipe ? CATEGORY_TAGS[dragRecipe.categories[0]] : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="px-5 pt-1 md:px-8 lg:px-10 md:max-w-[1400px] md:mx-auto">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1">
            <WeekNav weekKey={activeWeekKey} onPrev={goToPrevWeek} onNext={goToNextWeek} onToday={goToCurrentWeek} />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleShareImage}
              disabled={sharingImage}
              className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted active:scale-90 transition disabled:opacity-60"
              aria-label="Compartir imagen de la semana"
              title="Compartir imagen de la semana"
            >
              {sharingImage ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            </button>
            <button
              onClick={handleDownloadWeek}
              className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted active:scale-90 transition"
              aria-label="Descargar recetario de la semana"
              title="Descargar recetario de la semana"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => setActionsOpen(true)}
              className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted active:scale-90 transition"
              aria-label="Más acciones"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {stats && <WeekStats counts={stats.counts} total={stats.total} />}
        {stats && <WeekNutritionSummary nutrition={stats.nutrition} total={stats.total} />}

        <div className="md:flex md:items-start md:gap-5 pb-28 md:pb-6">
          <div className="md:flex-1 md:min-w-0">
            <CalendarGrid
              weekStart={weekStart}
              plan={plan}
              sameDate={sameDate}
              onPick={(dayKey, slotKey) => setPicker({ dayKey, slotKey })}
              onView={setViewingRecipeId}
              onRemove={(dayKey, slotKey) => removeMeal(activeWeekKey, dayKey, slotKey)}
            />
          </div>

          <RecipeTray
            open={trayOpen}
            onToggleOpen={() => setTrayOpen((v) => !v)}
            onView={setViewingRecipeId}
            onQuickAdd={setQuickAddId}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {dragRecipe && (
          <div className="w-[160px] rounded-xl bg-surface border-2 border-primary-400 shadow-pop pl-3 pr-2.5 py-2.5 rotate-2">
            <p className="text-[12px] font-semibold text-text leading-snug line-clamp-2">{dragRecipe.name}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{dragTag?.label}</p>
          </div>
        )}
      </DragOverlay>

      {picker && (
        <RecipePickerSheet
          open={!!picker}
          onClose={() => setPicker(null)}
          weekKey={activeWeekKey}
          dayKey={picker.dayKey}
          slotKey={picker.slotKey}
          slotLabel={SLOT_LABELS[picker.slotKey]}
          onViewRecipe={(recipeId) => setViewingRecipeId(recipeId)}
        />
      )}

      <RecipeDetailSheet recipeId={viewingRecipeId} open={!!viewingRecipeId} onClose={() => setViewingRecipeId(null)} />
      <AddToCalendarSheet open={!!quickAddId} onClose={() => setQuickAddId(null)} recipeId={quickAddId} />
      <WeekActionsSheet open={actionsOpen} onClose={() => setActionsOpen(false)} weekKey={activeWeekKey} />
    </DndContext>
  )
}
