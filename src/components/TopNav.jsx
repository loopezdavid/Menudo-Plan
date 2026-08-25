import { CalendarDays, BookOpen, ShoppingCart } from 'lucide-react'

const TABS = [
  { key: 'week', label: 'Semana', icon: CalendarDays },
  { key: 'recipes', label: 'Recetario', icon: BookOpen },
  { key: 'shopping', label: 'Lista de la compra', icon: ShoppingCart },
]

export default function TopNav({ active, onChange, badgeCount = 0 }) {
  return (
    <nav className="hidden md:flex items-center gap-1 rounded-full bg-surface-2/80 p-1">
      {TABS.map((tab) => {
        const isActive = tab.key === active
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
              isActive ? 'bg-surface text-primary-600 shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            <Icon size={15} strokeWidth={isActive ? 2.4 : 2} />
            {tab.label}
            {tab.key === 'shopping' && badgeCount > 0 && (
              <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
