import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { CATEGORIES } from '../../data/ingredients'
import { useStore } from '../../store/useStore'

const DEFAULT_ORDER = Object.entries(CATEGORIES)
  .sort((a, b) => a[1].order - b[1].order)
  .map(([id]) => id)

export default function ReorderCategoriesSheet({ open, onClose }) {
  const categoryOrder = useStore((s) => s.settings.categoryOrder)
  const setCategoryOrder = useStore((s) => s.setCategoryOrder)

  const order = categoryOrder && categoryOrder.length === DEFAULT_ORDER.length ? categoryOrder : DEFAULT_ORDER

  function move(index, dir) {
    const target = index + dir
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    setCategoryOrder(next)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Orden de la lista de la compra">
      <p className="text-[12.5px] text-text-muted -mt-1 mb-4">
        Ordena las secciones como el recorrido de tu súper — se aplica en la lista de la compra.
      </p>
      <div className="flex flex-col gap-2 pb-2">
        {order.map((id, i) => {
          const meta = CATEGORIES[id]
          if (!meta) return null
          return (
            <div key={id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
              <span className="text-lg">{meta.emoji}</span>
              <span className="flex-1 text-sm font-medium text-text">{meta.label}</span>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center active:scale-90 transition disabled:opacity-30"
                aria-label="Subir"
              >
                <ArrowUp size={14} className="text-text-muted" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center active:scale-90 transition disabled:opacity-30"
                aria-label="Bajar"
              >
                <ArrowDown size={14} className="text-text-muted" />
              </button>
            </div>
          )
        })}
      </div>
      <button
        onClick={() => setCategoryOrder(null)}
        className="flex items-center justify-center gap-1.5 w-full py-3 mt-2 mb-4 text-[13px] font-semibold text-text-muted"
      >
        <RotateCcw size={14} /> Restablecer orden por defecto
      </button>
    </Sheet>
  )
}
