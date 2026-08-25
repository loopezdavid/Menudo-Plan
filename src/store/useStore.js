import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { addWeeks, weekKey } from '../utils/date'
import { emptyWeek, INITIAL_WEEK_PLAN, SLOTS } from '../data/initialWeekPlan'
import { INITIAL_FIXED_HOME_ITEMS } from '../data/fixedHomeItems'
import { supabaseStorage } from './supabaseStorage'
import { INITIAL_MANUAL_ITEMS } from '../data/initialManualItems'
import { RECIPES, getRecipe } from '../data/recipes'

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const TODAY_KEY = weekKey(new Date())

const initialManualWithIds = INITIAL_MANUAL_ITEMS.map((item) => ({ ...item, id: uid('manual') }))

export const useStore = create(
  persist(
    (set, get) => ({
      // ------- estado -------
      activeWeekKey: TODAY_KEY,
      weekPlans: {
        [TODAY_KEY]: INITIAL_WEEK_PLAN,
      },
      manualItems: {
        [TODAY_KEY]: initialManualWithIds,
      },
      checkedItems: {},
      fixedHomeItems: INITIAL_FIXED_HOME_ITEMS,
      favorites: [],
      recentRecipeIds: [],
      // Recetas de fuera del recetario local: resultados de bancos online
      // (TheMealDB/Spoonacular/Edamam) en cuanto se ven o se añaden al
      // calendario, más las importadas/creadas a mano (source 'custom'/'ai').
      // Se guardan aquí para seguir disponibles (calendario, lista de la
      // compra, PDF) incluso sin red.
      externalRecipes: {},
      settings: {
        peopleCount: 2,
        themeMode: 'system', // 'system' | 'light' | 'dark'
        aiEngine: 'claude', // 'claude' | 'gemini' | 'mistral' | 'openrouter' — motor para Importar receta
        apiKeys: {
          spoonacular: '',
          edamamAppId: '',
          edamamAppKey: '',
          anthropic: '',
          gemini: '',
          geminiModel: '',
          mistral: '',
          mistralModel: '',
          openrouter: '',
          openrouterModel: '',
          googleSearchApiKey: '',
          googleSearchCx: '',
        },
      },

      // ------- navegación de semanas -------
      goToWeek: (key) => set({ activeWeekKey: key }),
      goToNextWeek: () =>
        set((s) => ({ activeWeekKey: weekKey(addWeeks(s.activeWeekKey, 1)) })),
      goToPrevWeek: () =>
        set((s) => ({ activeWeekKey: weekKey(addWeeks(s.activeWeekKey, -1)) })),
      goToCurrentWeek: () => set({ activeWeekKey: TODAY_KEY }),

      getWeekPlan: (key) => get().weekPlans[key] || emptyWeek(),

      // ------- calendario -------
      setMeal: (weekKeyArg, dayKey, slotKey, recipeId) =>
        set((s) => {
          const current = s.weekPlans[weekKeyArg] || emptyWeek()
          const nextWeek = {
            ...current,
            [dayKey]: { ...current[dayKey], [slotKey]: recipeId },
          }
          const recent = [recipeId, ...s.recentRecipeIds.filter((id) => id !== recipeId)].slice(0, 12)
          return {
            weekPlans: { ...s.weekPlans, [weekKeyArg]: nextWeek },
            recentRecipeIds: recent,
          }
        }),

      removeMeal: (weekKeyArg, dayKey, slotKey) =>
        set((s) => {
          const current = s.weekPlans[weekKeyArg] || emptyWeek()
          const nextWeek = {
            ...current,
            [dayKey]: { ...current[dayKey], [slotKey]: null },
          }
          return { weekPlans: { ...s.weekPlans, [weekKeyArg]: nextWeek } }
        }),

      clearWeek: (weekKeyArg) =>
        set((s) => ({ weekPlans: { ...s.weekPlans, [weekKeyArg]: emptyWeek() } })),

      duplicateWeek: (fromKey, toKey) =>
        set((s) => {
          const source = s.weekPlans[fromKey] || emptyWeek()
          return {
            weekPlans: { ...s.weekPlans, [toKey]: JSON.parse(JSON.stringify(source)) },
          }
        }),

      generateRandomWeek: (weekKeyArg) =>
        set((s) => {
          const byTag = (tag) => RECIPES.filter((r) => r.categories.includes(tag))
          const breakfasts = byTag('desayunos')
          const starters = byTag('primeros')
          const mains = RECIPES.filter(
            (r) => !r.categories.includes('desayunos') && !r.categories.includes('primeros')
          )
          const pick = (arr, exclude) => {
            const pool = arr.filter((r) => !exclude.includes(r.id))
            const list = pool.length ? pool : arr
            return list[Math.floor(Math.random() * list.length)]?.id || null
          }

          const next = emptyWeek()
          const usedMains = []
          for (const day of Object.keys(next)) {
            const b = pick(breakfasts, [])
            const l1 = pick(starters, [])
            const l2 = pick(mains, usedMains.slice(-4))
            usedMains.push(l2)
            const d1 = pick(starters, [l1])
            const d2 = pick(mains, usedMains.slice(-4))
            usedMains.push(d2)
            next[day] = { breakfast: b, lunch1: l1, lunch2: l2, dinner1: d1, dinner2: d2 }
          }
          return { weekPlans: { ...s.weekPlans, [weekKeyArg]: next } }
        }),

      // ------- lista de la compra -------
      toggleChecked: (weekKeyArg, lineKey) =>
        set((s) => {
          const weekChecked = { ...(s.checkedItems[weekKeyArg] || {}) }
          weekChecked[lineKey] = !weekChecked[lineKey]
          return { checkedItems: { ...s.checkedItems, [weekKeyArg]: weekChecked } }
        }),

      getManualItems: (weekKeyArg) => get().manualItems[weekKeyArg] || [],

      addManualItem: (weekKeyArg, item) =>
        set((s) => {
          const list = s.manualItems[weekKeyArg] || []
          const newItem = { id: uid('manual'), ingredientId: null, unit: 'ud', quantity: 1, ...item }
          return { manualItems: { ...s.manualItems, [weekKeyArg]: [...list, newItem] } }
        }),

      updateManualItem: (weekKeyArg, itemId, patch) =>
        set((s) => {
          const list = s.manualItems[weekKeyArg] || []
          return {
            manualItems: {
              ...s.manualItems,
              [weekKeyArg]: list.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
            },
          }
        }),

      removeManualItem: (weekKeyArg, itemId) =>
        set((s) => {
          const list = s.manualItems[weekKeyArg] || []
          return {
            manualItems: { ...s.manualItems, [weekKeyArg]: list.filter((it) => it.id !== itemId) },
          }
        }),

      // ------- artículos fijos de casa -------
      addFixedHomeItem: (item) =>
        set((s) => ({
          fixedHomeItems: [...s.fixedHomeItems, { id: uid('fixed'), ingredientId: null, unit: 'ud', quantity: 1, ...item }],
        })),
      updateFixedHomeItem: (id, patch) =>
        set((s) => ({
          fixedHomeItems: s.fixedHomeItems.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),
      removeFixedHomeItem: (id) =>
        set((s) => ({ fixedHomeItems: s.fixedHomeItems.filter((it) => it.id !== id) })),

      // ------- favoritos / recientes -------
      toggleFavorite: (recipeId) =>
        set((s) => ({
          favorites: s.favorites.includes(recipeId)
            ? s.favorites.filter((id) => id !== recipeId)
            : [...s.favorites, recipeId],
        })),

      // ------- ajustes -------
      setPeopleCount: (n) =>
        set((s) => ({ settings: { ...s.settings, peopleCount: Math.max(1, Math.min(8, n)) } })),
      setThemeMode: (mode) => set((s) => ({ settings: { ...s.settings, themeMode: mode } })),
      setApiKey: (field, value) =>
        set((s) => ({ settings: { ...s.settings, apiKeys: { ...s.settings.apiKeys, [field]: value } } })),
      setAiEngine: (engine) => set((s) => ({ settings: { ...s.settings, aiEngine: engine } })),

      // ------- recetas externas (bancos online) -------
      cacheExternalRecipe: (recipe) =>
        set((s) => ({ externalRecipes: { ...s.externalRecipes, [recipe.id]: recipe } })),
    }),
    {
      name: 'menusemanal-storage',
      version: 5,
      storage: createJSONStorage(() => supabaseStorage),
      migrate: (persisted, version) => {
        if (version < 2) {
          persisted.externalRecipes = persisted.externalRecipes || {}
          persisted.settings = {
            peopleCount: 2,
            themeMode: 'system',
            apiKeys: { spoonacular: '', edamamAppId: '', edamamAppKey: '' },
            ...persisted.settings,
          }
        }
        if (version < 3) {
          // Backfill sin pisar claves ya guardadas por el usuario.
          persisted.externalRecipes = persisted.externalRecipes || {}
          persisted.settings = {
            peopleCount: 2,
            themeMode: 'system',
            ...persisted.settings,
            apiKeys: {
              spoonacular: '',
              edamamAppId: '',
              edamamAppKey: '',
              anthropic: '',
              ...persisted.settings?.apiKeys,
            },
          }
        }
        if (version < 4) {
          persisted.settings = {
            peopleCount: 2,
            themeMode: 'system',
            aiEngine: 'claude',
            ...persisted.settings,
            apiKeys: {
              spoonacular: '',
              edamamAppId: '',
              edamamAppKey: '',
              anthropic: '',
              gemini: '',
              geminiModel: '',
              mistral: '',
              mistralModel: '',
              openrouter: '',
              openrouterModel: '',
              ...persisted.settings?.apiKeys,
            },
          }
        }
        if (version < 5) {
          persisted.settings = {
            ...persisted.settings,
            apiKeys: {
              googleSearchApiKey: '',
              googleSearchCx: '',
              ...persisted.settings?.apiKeys,
            },
          }
        }
        return persisted
      },
    }
  )
)

export function weekStatsForKey(weekKeyArg, weekPlans, lookupRecipe = getRecipe) {
  const plan = weekPlans[weekKeyArg]
  if (!plan) return null
  const counts = {}
  let total = 0
  for (const dayKey of Object.keys(plan)) {
    for (const slot of SLOTS) {
      const recipeId = plan[dayKey]?.[slot.key]
      if (!recipeId) continue
      const recipe = lookupRecipe(recipeId)
      if (!recipe) continue
      total += 1
      for (const tag of recipe.categories) {
        counts[tag] = (counts[tag] || 0) + 1
      }
    }
  }
  return { counts, total }
}

export { TODAY_KEY }
