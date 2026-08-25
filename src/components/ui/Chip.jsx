const CAT_COLOR_CLASSES = {
  fish: 'bg-cat-fish-bg text-cat-fish',
  seafood: 'bg-cat-seafood-bg text-cat-seafood',
  chicken: 'bg-cat-chicken-bg text-cat-chicken',
  meat: 'bg-cat-meat-bg text-cat-meat',
  pasta: 'bg-cat-pasta-bg text-cat-pasta',
  rice: 'bg-cat-rice-bg text-cat-rice',
  legume: 'bg-cat-legume-bg text-cat-legume',
  breakfast: 'bg-cat-breakfast-bg text-cat-breakfast',
  starter: 'bg-cat-starter-bg text-cat-starter',
  intl: 'bg-cat-intl-bg text-cat-intl',
  airfryer: 'bg-cat-airfryer-bg text-cat-airfryer',
  mycook: 'bg-cat-mycook-bg text-cat-mycook',
  neutral: 'bg-surface-2 text-text-muted',
  primary: 'bg-primary-100 text-primary-600',
}

export function Chip({ children, color = 'neutral', active = false, onClick, className = '', size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap transition-all select-none ${sizeClasses} ${
        active
          ? 'bg-primary-500 text-white shadow-sm'
          : CAT_COLOR_CLASSES[color] || CAT_COLOR_CLASSES.neutral
      } ${onClick ? 'active:scale-95 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

export default Chip
