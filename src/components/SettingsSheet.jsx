import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Sun, Moon, Monitor, Minus, Plus, Users, ChevronDown, Image as ImageIcon, Globe, Check, Sparkles, Bell, BellOff } from 'lucide-react'
import Sheet from './ui/Sheet'
import { useStore } from '../store/useStore'
import { getRecipe } from '../data/recipes'
import { AI_ENGINES } from '../services/aiRecipeImport'
import imageCredits from '../data/recipeImageCredits.json'

const THEME_OPTIONS = [
  { key: 'system', label: 'Auto', icon: Monitor },
  { key: 'light', label: 'Claro', icon: Sun },
  { key: 'dark', label: 'Oscuro', icon: Moon },
]

const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const AI_ENGINE_CONFIG = {
  claude: {
    keyField: 'anthropic',
    modelField: null,
    help: 'Consíguela en console.anthropic.com/settings/keys. Se paga por uso (céntimos por receta importada).',
  },
  gemini: {
    keyField: 'gemini',
    modelField: 'geminiModel',
    modelPlaceholder: 'gemini-3.6-flash (por defecto si lo dejas vacío)',
    help: 'Consíguela gratis en aistudio.google.com/apikey — tiene uso gratuito diario generoso.',
  },
  mistral: {
    keyField: 'mistral',
    modelField: 'mistralModel',
    modelPlaceholder: 'mistral-small-latest (por defecto si lo dejas vacío)',
    help: 'Consíguela en console.mistral.ai/api-keys.',
  },
  openrouter: {
    keyField: 'openrouter',
    modelField: 'openrouterModel',
    modelPlaceholder: 'p.ej. google/gemini-2.0-flash-001',
    modelRequired: true,
    help: 'Consíguela en openrouter.ai/keys. El modelo es obligatorio — mira los ids en openrouter.ai/models (elige uno con soporte de imagen si quieres importar por foto).',
  },
}

export default function SettingsSheet({ open, onClose }) {
  const themeMode = useStore((s) => s.settings.themeMode)
  const setThemeMode = useStore((s) => s.setThemeMode)
  const peopleCount = useStore((s) => s.settings.peopleCount)
  const setPeopleCount = useStore((s) => s.setPeopleCount)
  const apiKeys = useStore((s) => s.settings.apiKeys)
  const setApiKey = useStore((s) => s.setApiKey)
  const aiEngine = useStore((s) => s.settings.aiEngine)
  const setAiEngine = useStore((s) => s.setAiEngine)
  const reminders = useStore((s) => s.settings.reminders)
  const setReminderSetting = useStore((s) => s.setReminderSetting)
  const [creditsOpen, setCreditsOpen] = useState(false)
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )
  const activeAiConfig = AI_ENGINE_CONFIG[aiEngine] || AI_ENGINE_CONFIG.claude
  const reduceMotion = useReducedMotion()

  async function handleToggleReminder(field, value) {
    if (value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const result = await Notification.requestPermission()
      setNotifPermission(result)
      if (result !== 'granted') return
    }
    setReminderSetting(field, value)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Ajustes">
      <div className="flex flex-col gap-6 pb-8">
        <section className="flex flex-col items-center text-center pt-2 pb-1">
          <motion.img
            src="/logo-hero.png"
            alt="Menudo Plan"
            className="h-32 w-auto mb-1"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          />
          <p className="text-[11.5px] text-text-muted mt-0.5">Tu planificador semanal de comidas</p>
        </section>

        <section>
          <h3 className="text-[13px] font-semibold text-text-muted mb-2.5">Apariencia</h3>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setThemeMode(key)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 border transition ${
                  themeMode === key
                    ? 'border-primary-400 bg-primary-50 text-primary-600'
                    : 'border-border bg-surface text-text-muted'
                }`}
              >
                <Icon size={18} />
                <span className="text-[12px] font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[13px] font-semibold text-text-muted mb-2.5">Comensales</h3>
          <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Users size={17} className="text-primary-500" />
              <div>
                <p className="text-sm font-semibold text-text">Personas</p>
                <p className="text-[11px] text-text-muted">Recalcula la lista de la compra</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPeopleCount(peopleCount - 1)}
                className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center active:scale-90 transition"
              >
                <Minus size={15} />
              </button>
              <span className="w-5 text-center font-bold tabular-nums">{peopleCount}</span>
              <button
                onClick={() => setPeopleCount(peopleCount + 1)}
                className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center active:scale-90 transition"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[13px] font-semibold text-text-muted mb-2.5">Recordatorios</h3>
          <p className="text-[12px] text-text-muted leading-relaxed mb-3">
            Avisos locales del navegador — solo funcionan mientras abras la app (o la tengas instalada) ese
            día, no es un aviso garantizado en segundo plano.
          </p>
          {notifPermission === 'denied' && (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 text-amber-700 px-3.5 py-2.5 mb-3 text-[12px]">
              <BellOff size={14} className="shrink-0" />
              Bloqueaste las notificaciones para esta web — actívalas desde los ajustes del navegador si quieres usar esto.
            </div>
          )}
          <div className="flex flex-col gap-3">
            <ReminderRow
              icon={Bell}
              title="Planificar la semana"
              enabled={reminders?.planningEnabled}
              day={reminders?.planningDay}
              onToggle={(v) => handleToggleReminder('planningEnabled', v)}
              onDayChange={(d) => setReminderSetting('planningDay', d)}
            />
            <ReminderRow
              icon={Bell}
              title="Hacer la compra"
              enabled={reminders?.shoppingEnabled}
              day={reminders?.shoppingDay}
              onToggle={(v) => handleToggleReminder('shoppingEnabled', v)}
              onDayChange={(d) => setReminderSetting('shoppingDay', d)}
            />
          </div>
        </section>

        <section>
          <h3 className="text-[13px] font-semibold text-text-muted mb-2.5">Bancos de recetas online</h3>
          <p className="text-[12px] text-text-muted leading-relaxed mb-3">
            Al buscar en el recetario puedes traer recetas de fuera con foto e ingredientes y añadirlas
            directamente al calendario. TheMealDB ya está activo, sin nada que configurar.
          </p>

          <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-4 py-3 mb-3">
            <span className="h-7 w-7 shrink-0 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
              <Check size={14} />
            </span>
            <div>
              <p className="text-sm font-semibold text-text">TheMealDB</p>
              <p className="text-[11px] text-text-muted">Activo · gratis · sin configuración</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-surface-2 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={14} className="text-text-muted" />
                <p className="text-sm font-semibold text-text">Spoonacular</p>
              </div>
              <input
                value={apiKeys?.spoonacular || ''}
                onChange={(e) => setApiKey('spoonacular', e.target.value)}
                placeholder="Pega aquí tu API key"
                className="w-full rounded-xl bg-surface border border-border focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft"
              />
              <p className="text-[10.5px] text-text-muted mt-1.5">
                Consíguela gratis en spoonacular.com/food-api (150 peticiones/día).
              </p>
            </div>

            <div className="rounded-2xl bg-surface-2 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={14} className="text-text-muted" />
                <p className="text-sm font-semibold text-text">Edamam</p>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  value={apiKeys?.edamamAppId || ''}
                  onChange={(e) => setApiKey('edamamAppId', e.target.value)}
                  placeholder="App ID"
                  className="w-full rounded-xl bg-surface border border-border focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft"
                />
                <input
                  value={apiKeys?.edamamAppKey || ''}
                  onChange={(e) => setApiKey('edamamAppKey', e.target.value)}
                  placeholder="App Key"
                  className="w-full rounded-xl bg-surface border border-border focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft"
                />
              </div>
              <p className="text-[10.5px] text-text-muted mt-1.5">
                Consíguelos gratis en developer.edamam.com. Edamam no da los pasos, solo enlaza a la receta original.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[13px] font-semibold text-text-muted mb-2.5">Buscar fotos de platos</h3>
          <p className="text-[12px] text-text-muted leading-relaxed mb-3">
            Al añadir o editar una receta, "Buscar fotos" usa estas fuentes para encontrar una imagen del
            plato. Wikimedia Commons ya está activo (traduce automáticamente el nombre si hace falta), y
            puedes añadir Google Imágenes para mucha más cobertura, sobre todo con platos caseros o en
            español.
          </p>

          <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-4 py-3 mb-3">
            <span className="h-7 w-7 shrink-0 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
              <Check size={14} />
            </span>
            <div>
              <p className="text-sm font-semibold text-text">Wikimedia Commons</p>
              <p className="text-[11px] text-text-muted">Activo · gratis · sin configuración</p>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={14} className="text-text-muted" />
              <p className="text-sm font-semibold text-text">Google Imágenes</p>
            </div>
            <div className="flex flex-col gap-2">
              <input
                value={apiKeys?.googleSearchApiKey || ''}
                onChange={(e) => setApiKey('googleSearchApiKey', e.target.value)}
                placeholder="API key"
                className="w-full rounded-xl bg-surface border border-border focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft"
              />
              <input
                value={apiKeys?.googleSearchCx || ''}
                onChange={(e) => setApiKey('googleSearchCx', e.target.value)}
                placeholder="ID del motor de búsqueda (cx)"
                className="w-full rounded-xl bg-surface border border-border focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft"
              />
            </div>
            <p className="text-[10.5px] text-text-muted mt-1.5">
              Gratis hasta 100 búsquedas/día. Crea una API key en console.cloud.google.com (activa "Custom
              Search API") y un motor en programmablesearchengine.google.com con "Buscar imágenes" y
              "Buscar en toda la web" activados — copia aquí la key y el ID del motor (cx).
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-[13px] font-semibold text-text-muted mb-2.5">Importar con IA</h3>
          <p className="text-[12px] text-text-muted leading-relaxed mb-3">
            En el recetario, "Importar receta" puede leer una receta a partir de un texto pegado, una URL o una
            foto, y rellenarte los ingredientes y pasos automáticamente (los revisas antes de guardar). Elige el
            motor y pega tu propia API key — nunca sale de este dispositivo salvo hacia la API de ese proveedor.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {Object.entries(AI_ENGINES).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setAiEngine(key)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-semibold transition border ${
                  aiEngine === key
                    ? 'border-primary-400 bg-primary-50 text-primary-600'
                    : 'border-border bg-surface text-text-muted'
                }`}
              >
                <Sparkles size={13} /> {meta.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-surface-2 px-4 py-3">
            <input
              value={apiKeys?.[activeAiConfig.keyField] || ''}
              onChange={(e) => setApiKey(activeAiConfig.keyField, e.target.value)}
              placeholder="Pega aquí tu API key"
              className="w-full rounded-xl bg-surface border border-border focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft"
            />
            {activeAiConfig.modelField && (
              <input
                value={apiKeys?.[activeAiConfig.modelField] || ''}
                onChange={(e) => setApiKey(activeAiConfig.modelField, e.target.value)}
                placeholder={activeAiConfig.modelPlaceholder}
                className="w-full rounded-xl bg-surface border border-border focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text placeholder:text-text-soft mt-2"
              />
            )}
            <p className="text-[10.5px] text-text-muted mt-1.5">{activeAiConfig.help}</p>
          </div>
        </section>

        <section>
          <h3 className="text-[13px] font-semibold text-text-muted mb-2.5">Acerca de</h3>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Menudo Plan sincroniza tus recetas, tu plan semanal y tu lista de la compra entre tus
            dispositivos. Puedes instalarla como aplicación desde el menú del navegador para usarla como
            una app nativa.
          </p>
        </section>

        <section>
          <button
            onClick={() => setCreditsOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl bg-surface-2 px-4 py-3.5"
          >
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-primary-500" />
              <span className="text-sm font-semibold text-text">Créditos de las fotos</span>
            </div>
            <ChevronDown size={16} className={`text-text-muted transition-transform ${creditsOpen ? 'rotate-180' : ''}`} />
          </button>
          {creditsOpen && (
            <div className="mt-2 flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              <p className="text-[11px] text-text-muted leading-relaxed px-1">
                Fotos de Wikimedia Commons, contenido de reuso libre.
              </p>
              {Object.entries(imageCredits).map(([recipeId, credit]) => {
                const recipe = getRecipe(recipeId)
                if (!recipe) return null
                return (
                  <a
                    key={recipeId}
                    href={credit.source}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-surface border border-border px-3 py-2 active:scale-[0.98] transition"
                  >
                    <p className="text-[12px] font-semibold text-text">{recipe.name}</p>
                    <p className="text-[10.5px] text-text-muted">
                      {credit.artist} · {credit.license}
                    </p>
                  </a>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </Sheet>
  )
}

function ReminderRow({ icon: Icon, title, enabled, day, onToggle, onDayChange }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={15} className={enabled ? 'text-primary-500' : 'text-text-muted'} />
          <p className="text-sm font-semibold text-text truncate">{title}</p>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`shrink-0 h-6 w-11 rounded-full transition relative ${enabled ? 'bg-primary-500' : 'bg-surface border border-border'}`}
          role="switch"
          aria-checked={enabled}
          aria-label={title}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {enabled && (
        <select
          value={day}
          onChange={(e) => onDayChange(Number(e.target.value))}
          className="w-full mt-2.5 rounded-xl bg-surface border border-border focus:border-primary-200 focus:outline-none px-3 py-2 text-[13px] text-text"
        >
          {WEEKDAY_NAMES.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
