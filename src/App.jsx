import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Settings } from 'lucide-react'
import BottomNav from './components/BottomNav'
import TopNav from './components/TopNav'
import WeekView from './components/week/WeekView'
import RecipesView from './components/recipes/RecipesView'
import ShoppingListView from './components/shopping/ShoppingListView'
import SettingsSheet from './components/SettingsSheet'
import IconButton from './components/ui/IconButton'
import { useTheme } from './hooks/useTheme'
import { useStore } from './store/useStore'
import { calculateShoppingList } from './utils/shoppingCalculator'
import { getAnyRecipe } from './utils/recipeLookup'

const TITLES = {
  week: 'Tu semana',
  recipes: 'Recetario',
  shopping: 'Lista de la compra',
}

export default function App() {
  useTheme()
  const reduceMotion = useReducedMotion()
  const [tab, setTab] = useState('week')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeWeekKey = useStore((s) => s.activeWeekKey)
  const weekPlan = useStore((s) => s.weekPlans[activeWeekKey])
  const manualItems = useStore((s) => s.manualItems[activeWeekKey])
  const fixedHomeItems = useStore((s) => s.fixedHomeItems)
  const checked = useStore((s) => s.checkedItems[activeWeekKey])
  const peopleCount = useStore((s) => s.settings.peopleCount)
  const externalRecipes = useStore((s) => s.externalRecipes)

  const shoppingList = useMemo(
    () =>
      calculateShoppingList({
        weekPlan: weekPlan || {},
        manualItems: manualItems || [],
        fixedHomeItems,
        checked: checked || {},
        peopleCount,
        lookupRecipe: getAnyRecipe,
      }),
    // externalRecipes: getAnyRecipe lee el store directamente (getState), no es un
    // argumento reactivo — pero necesitamos recalcular cuando cambie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekPlan, manualItems, fixedHomeItems, checked, peopleCount, externalRecipes]
  )

  const pendingCount = shoppingList.total - shoppingList.checkedCount

  return (
    <div className="flex flex-col min-h-svh bg-bg text-text w-full">
      <header className="sticky top-0 z-20 safe-top bg-bg/85 backdrop-blur-md border-b border-transparent md:border-border">
        <div className="relative mx-auto w-full max-w-md md:max-w-[1400px] flex items-center justify-center px-16 pt-3.5 pb-1 md:px-8 lg:px-10 md:pt-4">
          <motion.img
            src="/logo-hero.png"
            alt="Menudo Plan"
            className="h-16 sm:h-20 w-auto"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          />

          <IconButton
            onClick={() => setSettingsOpen(true)}
            className="absolute right-5 md:right-8 lg:right-10 top-1/2 -translate-y-1/2 h-10 w-10 bg-surface border border-border text-text-muted shadow-sm shrink-0"
            aria-label="Ajustes"
          >
            <Settings size={19} />
          </IconButton>
        </div>

        <div className="mx-auto w-full max-w-md md:max-w-[1400px] flex items-center justify-between gap-4 px-5 pb-2.5 md:px-8 lg:px-10 md:pb-3.5">
          <h1 className="min-w-0 truncate text-[13px] sm:text-[14px] font-semibold text-text-muted leading-none tracking-tight">
            {TITLES[tab]}
          </h1>

          <TopNav active={tab} onChange={setTab} badgeCount={pendingCount} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-4">
        {tab === 'week' && <WeekView />}
        {tab === 'recipes' && (
          <div className="mx-auto w-full max-w-md md:max-w-[1400px] md:px-3">
            <RecipesView />
          </div>
        )}
        {tab === 'shopping' && (
          <div className="mx-auto w-full max-w-md md:max-w-2xl">
            <ShoppingListView shoppingList={shoppingList} weekKey={activeWeekKey} />
          </div>
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} badgeCount={pendingCount} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
