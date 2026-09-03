import { useEffect, useMemo, useState } from 'react'
import Sheet from '../ui/Sheet'
import PrimaryButton from '../ui/PrimaryButton'
import { INGREDIENTS } from '../../data/ingredients'

const UNITS = ['ud', 'g', 'kg', 'ml', 'l', 'diente', 'rebanada']

const CATALOG_LIST = Object.values(INGREDIENTS)

export default function AddProductModal({ open, onClose, onAdd, title = 'Añadir producto', initial = null, submitLabel = 'Añadir' }) {
  const [name, setName] = useState(initial?.name || '')
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1)
  const [unit, setUnit] = useState(initial?.unit || 'ud')
  const [matchedId, setMatchedId] = useState(initial?.ingredientId || null)

  useEffect(() => {
    if (open) {
      setName(initial?.name || '')
      setQuantity(initial?.quantity ?? 1)
      setUnit(initial?.unit || 'ud')
      setMatchedId(initial?.ingredientId || null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const suggestions = useMemo(() => {
    if (!name.trim() || matchedId) return []
    const q = name.trim().toLowerCase()
    return CATALOG_LIST.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 5)
  }, [name, matchedId])

  function reset() {
    setName('')
    setQuantity(1)
    setUnit('ud')
    setMatchedId(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), quantity: Number(quantity) || 1, unit, ingredientId: matchedId })
    reset()
    onClose()
  }

  function pickSuggestion(ing) {
    setName(ing.name)
    setUnit(ing.unit)
    setMatchedId(ing.id)
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={title}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-6">
        <div>
          <label className="text-[13px] font-semibold text-text-muted mb-1.5 block">Nombre</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setMatchedId(null)
            }}
            placeholder="Ej. Papel higiénico"
            className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3.5 py-2.5 text-sm text-text placeholder:text-text-soft"
          />
          {suggestions.length > 0 && (
            <div className="mt-1.5 flex flex-col rounded-xl border border-border overflow-hidden">
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => pickSuggestion(s)}
                  className="text-left px-3.5 py-2 text-sm text-text bg-surface hover:bg-surface-2 border-b border-border last:border-0"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[13px] font-semibold text-text-muted mb-1.5 block">Cantidad</label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3.5 py-2.5 text-sm text-text"
            />
          </div>
          <div className="flex-1">
            <label className="text-[13px] font-semibold text-text-muted mb-1.5 block">Unidad</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-xl bg-surface-2 border border-transparent focus:border-primary-200 focus:outline-none px-3.5 py-2.5 text-sm text-text"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <PrimaryButton
          type="submit"
          className="w-full rounded-2xl bg-primary-500 py-3.5 text-[15px] font-semibold text-white transition-colors mt-1"
        >
          {submitLabel}
        </PrimaryButton>
      </form>
    </Sheet>
  )
}
