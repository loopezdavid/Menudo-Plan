import { CalendarDays, BookOpen, ShoppingCart } from 'lucide-react'

const TABS = [
  { key: 'week', label: 'Semana', icon: CalendarDays },
  { key: 'recipes', label: 'Recetas', icon: BookOpen },
  { key: 'shopping', label: 'Compra', icon: ShoppingCart },
]

export default function BottomNav({ active, onChange, badgeCount = 0 }) {
  return (
    <nav className="md:hidden sticky bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const isActive = tab.key === active
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 pt-3 active:scale-95 transition-transform"
            >
              <span className="relative">
                <Icon
                  size={23}
                  strokeWidth={isActive ? 2.4 : 2}
                  className={isActive ? 'text-primary-500' : 'text-text-soft'}
                />
                {tab.key === 'shopping' && badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] font-medium ${isActive ? 'text-primary-500' : 'text-text-soft'}`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0.5 h-1 w-6 rounded-full bg-primary-500" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
