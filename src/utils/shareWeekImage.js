import { DAYS, SLOTS } from '../data/initialWeekPlan'
import { formatWeekRange } from './date'
import { getAnyRecipe } from './recipeLookup'

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Envuelve texto en varias líneas dentro de maxWidth, hasta maxLines
// (con "…" en la última si no cabe todo), y lo pinta centrado en (cx, y0).
function wrapCentered(ctx, text, cx, y0, maxWidth, lineHeight, maxLines = 3) {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines - 1) break
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) lines.length = maxLines
  const remaining = words.slice(lines.join(' ').split(/\s+/).length).join(' ')
  if (remaining && lines.length === maxLines) {
    let last = lines[maxLines - 1]
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) {
      last = last.slice(0, -1)
    }
    lines[maxLines - 1] = `${last}…`
  }
  const startY = y0 - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight))
}

const SLOT_LABEL_LINES = Object.fromEntries(
  SLOTS.map((s) => [s.key, s.group ? [s.group, s.label] : [s.label]])
)

// Genera un póster PNG (canvas, sin depender de fotos externas por CORS) con
// el menú de la semana en formato tabla, listo para compartir o descargar.
export async function buildWeekPosterBlob({ weekKey, plan }) {
  const leftColW = 130
  const headerH = 110
  const dayHeaderH = 60
  const rowH = 110
  const colW = 150
  const width = leftColW + colW * DAYS.length + 40
  const height = headerH + dayHeaderH + rowH * SLOTS.length + 50

  const canvas = document.createElement('canvas')
  const scale = 2 // nitidez en pantallas retina
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.fillStyle = '#faf8f3'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#2a2822'
  ctx.font = 'bold 28px "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('🍽️ Menú semanal', 24, 44)
  ctx.fillStyle = '#6f6b5f'
  ctx.font = '16px "Segoe UI", sans-serif'
  ctx.fillText(formatWeekRange(weekKey), 24, 72)

  ctx.textAlign = 'center'
  DAYS.forEach((day, i) => {
    const x = leftColW + i * colW + colW / 2
    ctx.fillStyle = '#2a2822'
    ctx.font = 'bold 14px "Segoe UI", sans-serif'
    ctx.fillText(day.label.slice(0, 3).toUpperCase(), x, headerH + 26)
  })

  SLOTS.forEach((slot, r) => {
    const y = headerH + dayHeaderH + r * rowH

    ctx.textAlign = 'left'
    ctx.fillStyle = '#6f6b5f'
    ctx.font = 'bold 12px "Segoe UI", sans-serif'
    SLOT_LABEL_LINES[slot.key].forEach((line, i) => {
      ctx.fillText(line, 20, y + rowH / 2 - 6 + i * 15)
    })

    DAYS.forEach((day, c) => {
      const x = leftColW + c * colW
      const recipeId = plan[day.key]?.[slot.key]
      const recipe = recipeId ? getAnyRecipe(recipeId) : null

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#eae5d8'
      ctx.lineWidth = 1
      roundRect(ctx, x + 5, y + 5, colW - 10, rowH - 10, 10)
      ctx.fill()
      ctx.stroke()

      ctx.textAlign = 'center'
      if (recipe) {
        ctx.fillStyle = '#2a2822'
        ctx.font = '12.5px "Segoe UI", sans-serif'
        wrapCentered(ctx, recipe.name, x + colW / 2, y + rowH / 2, colW - 26, 15, 4)
      } else {
        ctx.fillStyle = '#c8c4b6'
        ctx.font = '13px "Segoe UI", sans-serif'
        ctx.fillText('—', x + colW / 2, y + rowH / 2 + 4)
      }
    })
  })

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export async function shareOrDownloadPoster(blob, filename) {
  if (navigator.canShare && navigator.share) {
    const file = new File([blob], filename, { type: 'image/png' })
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Menú semanal' })
        return 'shared'
      } catch (err) {
        if (err?.name === 'AbortError') return 'cancelled'
      }
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return 'downloaded'
}
