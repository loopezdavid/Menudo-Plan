import ShoppingItemRow from './ShoppingItemRow'

export default function ShoppingCategorySection({ category, onToggle }) {
  const checkedCount = category.items.filter((i) => i.checked).length
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-[14px] font-bold text-text flex items-center gap-1.5">
          <span>{category.emoji}</span> {category.label}
        </h3>
        <span className="text-[12px] text-text-muted tabular-nums">
          {checkedCount}/{category.items.length}
        </span>
      </div>
      <div className="flex flex-col gap-1 rounded-2xl bg-surface border border-border p-1.5">
        {category.items.map((item) => (
          <ShoppingItemRow key={item.id} item={item} onToggle={() => onToggle(item.id)} />
        ))}
      </div>
    </div>
  )
}
