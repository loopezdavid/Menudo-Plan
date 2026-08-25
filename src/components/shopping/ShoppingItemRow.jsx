import { Check } from 'lucide-react'

function formatQty(qty, unit) {
  const rounded = Math.round(qty * 100) / 100
  return `${rounded % 1 === 0 ? rounded : rounded}${unit ? ' ' + unit : ''}`
}

export default function ShoppingItemRow({ item, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        item.checked ? 'bg-primary-50' : 'bg-surface'
      }`}
    >
      <span
        className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.checked ? 'bg-primary-500 border-primary-500' : 'border-border'
        }`}
      >
        {item.checked && <Check size={12} strokeWidth={3} className="text-white" />}
      </span>
      <span
        className={`flex-1 text-[14px] font-medium transition-colors ${
          item.checked ? 'text-primary-600/70 line-through' : 'text-text'
        }`}
      >
        {item.name}
      </span>
      <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${item.checked ? 'text-primary-600/60' : 'text-text-muted'}`}>
        {formatQty(item.quantity, item.unit)}
      </span>
    </button>
  )
}
