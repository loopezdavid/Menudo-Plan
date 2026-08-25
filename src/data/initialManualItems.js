// Productos manuales precargados en la primera semana. Si el ingrediente ya
// aparece por las recetas de la semana, el calculador de la compra suma las
// cantidades en una sola línea en lugar de duplicarla (mismo ingredientId).
export const INITIAL_MANUAL_ITEMS = [
  { name: 'Pepino', quantity: 1, unit: 'ud', ingredientId: 'pepino' },
  { name: 'Tomate', quantity: 3, unit: 'ud', ingredientId: 'tomate' },
  { name: 'Lentejas', quantity: 400, unit: 'g', ingredientId: 'lentejas' },
  { name: 'Queso feta', quantity: 100, unit: 'g', ingredientId: 'queso-feta' },
  { name: 'Atún', quantity: 150, unit: 'g', ingredientId: 'atun' },
  { name: 'Pan de molde', quantity: 6, unit: 'rebanada', ingredientId: 'pan-de-molde' },
  { name: 'Fajitas', quantity: 6, unit: 'ud', ingredientId: 'tortilla-trigo' },
]
