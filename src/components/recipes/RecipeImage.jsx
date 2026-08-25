import { useState } from 'react'
import { ChefHat } from 'lucide-react'
import { getRecipeImage } from '../../utils/recipeImages'
import { CATEGORY_TAGS } from '../../data/categoryTags'

const GRADIENT_CLASSES = {
  fish: 'from-cat-fish-bg to-surface-2',
  seafood: 'from-cat-seafood-bg to-surface-2',
  chicken: 'from-cat-chicken-bg to-surface-2',
  meat: 'from-cat-meat-bg to-surface-2',
  pasta: 'from-cat-pasta-bg to-surface-2',
  rice: 'from-cat-rice-bg to-surface-2',
  legume: 'from-cat-legume-bg to-surface-2',
  breakfast: 'from-cat-breakfast-bg to-surface-2',
  starter: 'from-cat-starter-bg to-surface-2',
  intl: 'from-cat-intl-bg to-surface-2',
  airfryer: 'from-cat-airfryer-bg to-surface-2',
  mycook: 'from-cat-mycook-bg to-surface-2',
}

export default function RecipeImage({ recipeId, categories = [], imageUrl, className = '', iconSize = 22 }) {
  const [failed, setFailed] = useState(false)
  const src = !failed && (imageUrl || getRecipeImage(recipeId))

  if (src) {
    return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  }

  const tag = CATEGORY_TAGS[categories[0]]
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${GRADIENT_CLASSES[tag?.color] || 'from-surface-2 to-surface'} ${className}`}
    >
      <ChefHat size={iconSize} className="text-text-soft/60" strokeWidth={1.6} />
    </div>
  )
}
