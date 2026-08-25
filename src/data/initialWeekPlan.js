// Semana inicial precargada (lunes a domingo).
export const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

export const SLOTS = [
  { key: 'breakfast', label: 'Desayuno', group: null },
  { key: 'lunch1', label: 'Primero', group: 'Comida' },
  { key: 'lunch2', label: 'Segundo', group: 'Comida' },
  { key: 'dinner1', label: 'Primero', group: 'Cena' },
  { key: 'dinner2', label: 'Segundo', group: 'Cena' },
]

export const INITIAL_WEEK_PLAN = {
  monday: {
    breakfast: 'pancakes-avena-platano',
    lunch1: 'vichyssoise',
    lunch2: 'salmon-miel-mostaza',
    dinner1: 'tomate-asado-mozzarella',
    dinner2: 'wrap-pollo',
  },
  tuesday: {
    breakfast: 'tostadas-huevo-pavo-queso',
    lunch1: 'salmorejo',
    lunch2: 'pasta-bolonesa',
    dinner1: 'crema-calabacin-parmesano',
    dinner2: 'berenjena-rellena',
  },
  wednesday: {
    breakfast: 'overnight-oats-tiramisu',
    lunch1: 'garbanzos-griegos',
    lunch2: 'pollo-souvlaki',
    dinner1: 'vichyssoise',
    dinner2: 'bacalao-puerro',
  },
  thursday: {
    breakfast: 'tostadas-huevo-pavo-queso',
    lunch1: 'crema-zanahoria-curry-naranja',
    lunch2: 'arroz-almejas',
    dinner1: 'crema-calabacin-parmesano',
    dinner2: 'tallarines-ternera',
  },
  friday: {
    breakfast: 'french-toast-proteica',
    lunch1: 'judias-verdes-jamon',
    lunch2: 'pasta-calabaza-pollo',
    dinner1: 'salmorejo',
    dinner2: 'tacos-merluza',
  },
  saturday: {
    breakfast: 'pancakes-avena-platano',
    lunch1: 'ensaladilla-rusa',
    lunch2: 'ternera-chimichurri',
    dinner1: 'crema-zanahoria-curry-naranja',
    dinner2: 'smash-burger',
  },
  sunday: {
    breakfast: 'tostadas-huevo-pavo-queso',
    lunch1: 'tomate-asado-mozzarella',
    lunch2: 'poke-salmon',
    dinner1: 'crema-calabacin-parmesano',
    dinner2: 'pollo-parmigiana',
  },
}

export function emptyWeek() {
  const week = {}
  for (const day of DAYS) {
    week[day.key] = {}
    for (const slot of SLOTS) week[day.key][slot.key] = null
  }
  return week
}
