function toDateOnly(input) {
  if (typeof input === 'string') {
    const [y, m, day] = input.split('-').map(Number)
    return new Date(y, m - 1, day)
  }
  const d = input instanceof Date ? input : new Date(input)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Lunes de la semana que contiene `date`.
export function getWeekStart(date = new Date()) {
  const d = toDateOnly(date)
  const day = d.getDay() // 0 domingo .. 6 sábado
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function addWeeks(date, weeks) {
  const d = toDateOnly(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

export function weekKey(date) {
  const d = getWeekStart(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function formatWeekRange(weekStart) {
  const start = getWeekStart(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth) {
    return `${start.getDate()} – ${end.getDate()} de ${MONTHS[end.getMonth()]}`
  }
  if (sameYear) {
    return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)}`
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} ${start.getFullYear()} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`
}

export function isCurrentWeek(weekStart) {
  return weekKey(weekStart) === weekKey(new Date())
}

export function formatShortDate(date) {
  const d = toDateOnly(date)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
}
