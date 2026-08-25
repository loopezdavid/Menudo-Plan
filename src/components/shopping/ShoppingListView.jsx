import { useState } from 'react'
import { Plus, ListChecks, Share2 } from 'lucide-react'
import ShoppingCategorySection from './ShoppingCategorySection'
import ProgressBar from '../ui/ProgressBar'
import AddProductModal from './AddProductModal'
import ManageItemsSheet from './ManageItemsSheet'
import { useStore } from '../../store/useStore'

export default function ShoppingListView({ shoppingList, weekKey }) {
  const [addOpen, setAddOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const toggleChecked = useStore((s) => s.toggleChecked)
  const addManualItem = useStore((s) => s.addManualItem)

  const { categories, total, checkedCount } = shoppingList

  function handleShare() {
    const lines = categories
      .map((cat) => {
        const items = cat.items.map((i) => `${i.checked ? '✔' : '▢'} ${i.name} — ${i.quantity} ${i.unit}`).join('\n')
        return `${cat.emoji} ${cat.label}\n${items}`
      })
      .join('\n\n')
    const text = `Lista de la compra (${checkedCount}/${total})\n\n${lines}`

    if (navigator.share) {
      navigator.share({ title: 'Lista de la compra', text }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="px-5 pt-1">
      <div className="rounded-2xl bg-surface border border-border p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[15px] font-bold text-text">
            {checkedCount} / {total} productos
          </p>
          <span className="text-[12px] font-semibold text-primary-500">
            {total > 0 ? Math.round((checkedCount / total) * 100) : 0}%
          </span>
        </div>
        <ProgressBar value={checkedCount} total={total} />
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setAddOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-primary-500 py-3 text-[13.5px] font-semibold text-white active:scale-[0.98] transition"
        >
          <Plus size={16} /> Añadir producto
        </button>
        <button
          onClick={() => setManageOpen(true)}
          className="h-[46px] w-[46px] shrink-0 rounded-2xl bg-surface-2 flex items-center justify-center active:scale-95 transition text-text-muted"
          aria-label="Gestionar productos"
        >
          <ListChecks size={18} />
        </button>
        <button
          onClick={handleShare}
          className="h-[46px] w-[46px] shrink-0 rounded-2xl bg-surface-2 flex items-center justify-center active:scale-95 transition text-text-muted"
          aria-label="Compartir lista"
        >
          <Share2 size={17} />
        </button>
      </div>

      {total === 0 && (
        <p className="text-center text-sm text-text-muted py-12">
          Añade platos a tu semana o productos manuales para generar la lista.
        </p>
      )}

      <div className="pb-6">
        {categories.map((cat) => (
          <ShoppingCategorySection key={cat.id} category={cat} onToggle={(id) => toggleChecked(weekKey, id)} />
        ))}
      </div>

      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(data) => addManualItem(weekKey, data)}
      />
      <ManageItemsSheet open={manageOpen} onClose={() => setManageOpen(false)} weekKey={weekKey} />
    </div>
  )
}
