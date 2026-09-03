import { useEffect } from 'react'
import { useStore } from '../store/useStore'

// Recordatorios locales (Web Notifications), sin servidor de push: se
// comprueban cada vez que se abre o se vuelve a la app. Si el día de hoy
// coincide con el configurado y no se ha avisado ya hoy, se muestra una
// notificación. No es un aviso garantizado en segundo plano — solo funciona
// mientras el dispositivo abre la app (o la PWA instalada) ese día.
function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function maybeNotify(storageKey, title, body) {
  if (Notification.permission !== 'granted') return
  const lastShown = localStorage.getItem(storageKey)
  const today = todayKey()
  if (lastShown === today) return
  new Notification(title, { body, icon: '/pwa-192.png' })
  localStorage.setItem(storageKey, today)
}

export function useReminders() {
  const reminders = useStore((s) => s.settings.reminders)

  useEffect(() => {
    function check() {
      if (typeof Notification === 'undefined') return
      const day = new Date().getDay()
      if (reminders?.planningEnabled && day === Number(reminders.planningDay)) {
        maybeNotify('reminder-planning-shown', 'Menudo Plan', '¿Planificamos el menú de esta semana? 🍽️')
      }
      if (reminders?.shoppingEnabled && day === Number(reminders.shoppingDay)) {
        maybeNotify('reminder-shopping-shown', 'Menudo Plan', 'Hoy toca compra — revisa la lista antes de salir 🛒')
      }
    }

    check()
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [reminders])
}
