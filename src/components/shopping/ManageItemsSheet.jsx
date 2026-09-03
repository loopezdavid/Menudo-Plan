import { useState } from 'react'
import { Pencil, Trash2, Plus, Package, PackageCheck } from 'lucide-react'
import Sheet from '../ui/Sheet'
import AddProductModal from './AddProductModal'
import { useStore } from '../../store/useStore'

export default function ManageItemsSheet({ open, onClose, weekKey }) {
  const manualItems = useStore((s) => s.manualItems[weekKey] || [])
  const fixedHomeItems = useStore((s) => s.fixedHomeItems)
  const addManualItem = useStore((s) => s.addManualItem)
  const updateManualItem = useStore((s) => s.updateManualItem)
  const removeManualItem = useStore((s) => s.removeManualItem)
  const addFixedHomeItem = useStore((s) => s.addFixedHomeItem)
  const updateFixedHomeItem = useStore((s) => s.updateFixedHomeItem)
  const removeFixedHomeItem = useStore((s) => s.removeFixedHomeItem)
  const togglePantryStock = useStore((s) => s.togglePantryStock)

  const [editing, setEditing] = useState(null) // { scope: 'manual'|'fixed', item }
  const [addingScope, setAddingScope] = useState(null) // 'manual' | 'fixed'

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Gestionar productos">
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-semibold text-text">Productos manuales de esta semana</h3>
          </div>
          <div className="flex flex-col gap-2 mb-2">
            {manualItems.length === 0 && (
              <p className="text-sm text-text-muted py-2">Sin productos manuales todavía.</p>
            )}
            {manualItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onEdit={() => setEditing({ scope: 'manual', item })}
                onRemove={() => removeManualItem(weekKey, item.id)}
              />
            ))}
          </div>
          <button
            onClick={() => setAddingScope('manual')}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-600 py-1.5"
          >
            <Plus size={15} /> Añadir producto
          </button>
        </section>

        <section className="mb-4">
          <h3 className="text-[15px] font-semibold text-text mb-2">🏠 Artículos fijos de casa</h3>
          <p className="text-[12px] text-text-muted mb-2 -mt-1">
            Se añaden cada semana, salvo que marques que ya los tienes en la despensa.
          </p>
          <div className="flex flex-col gap-2 mb-2">
            {fixedHomeItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onEdit={() => setEditing({ scope: 'fixed', item })}
                onRemove={() => removeFixedHomeItem(item.id)}
                onTogglePantry={() => togglePantryStock(item.id)}
              />
            ))}
          </div>
          <button
            onClick={() => setAddingScope('fixed')}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-600 py-1.5 pb-2"
          >
            <Plus size={15} /> Añadir artículo fijo
          </button>
        </section>
      </Sheet>

      <AddProductModal
        open={!!addingScope}
        onClose={() => setAddingScope(null)}
        title={addingScope === 'fixed' ? 'Añadir artículo fijo' : 'Añadir producto'}
        onAdd={(data) => {
          if (addingScope === 'fixed') addFixedHomeItem(data)
          else addManualItem(weekKey, data)
        }}
      />

      <AddProductModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar producto"
        submitLabel="Guardar"
        initial={editing?.item}
        onAdd={(data) => {
          if (editing?.scope === 'fixed') updateFixedHomeItem(editing.item.id, data)
          else updateManualItem(weekKey, editing.item.id, data)
        }}
      />
    </>
  )
}

function ItemRow({ item, onEdit, onRemove, onTogglePantry }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2.5">
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${item.inStock ? 'text-text-soft line-through' : 'text-text'}`}>{item.name}</p>
        <p className="text-[11px] text-text-muted">
          {item.quantity} {item.unit}
        </p>
      </div>
      {onTogglePantry && (
        <button
          onClick={onTogglePantry}
          className={`h-8 w-8 rounded-full flex items-center justify-center active:scale-90 transition ${
            item.inStock ? 'bg-primary-50 text-primary-600' : 'bg-surface-2 text-text-muted'
          }`}
          aria-label={item.inStock ? 'Ya lo tienes — pulsa cuando se acabe' : 'Marcar que ya lo tienes en casa'}
          title={item.inStock ? 'En despensa — pulsa cuando se acabe' : 'Marcar que ya lo tienes'}
        >
          {item.inStock ? <PackageCheck size={14} /> : <Package size={14} />}
        </button>
      )}
      <button onClick={onEdit} className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center active:scale-90 transition">
        <Pencil size={13} className="text-text-muted" />
      </button>
      <button onClick={onRemove} className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center active:scale-90 transition">
        <Trash2 size={13} className="text-rose-500" />
      </button>
    </div>
  )
}
