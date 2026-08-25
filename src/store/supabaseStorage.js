// Adaptador de almacenamiento para zustand/persist que sincroniza el estado
// completo de la app (recetas propias/editadas, plan semanal, lista de la
// compra, ajustes...) con una única fila en Supabase, además de guardarlo
// en localStorage como caché rápida y respaldo offline.
//
// Estrategia (pensada para uso personal, sin login):
// - Al cargar la app: se pide la fila 'default' a Supabase. Si existe y
//   tiene contenido, esa es la fuente de verdad (así el móvil ve lo último
//   guardado desde el PC, y viceversa) y se refresca la caché local.
//   Si no hay red o la fila está vacía, se usa lo que haya en localStorage.
// - Al guardar: se escribe siempre en localStorage al instante, y además
//   se sube a Supabase con un pequeño retraso (debounce) para no disparar
//   una petición en cada tecla.
import { supabase } from '../services/supabaseClient'

const ROW_ID = 'default'
const DEBOUNCE_MS = 900

let pushTimer = null

async function fetchCloud() {
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', ROW_ID)
      .maybeSingle()
    if (error || !data?.data) return null
    const cloudData = data.data
    if (!cloudData || typeof cloudData !== 'object' || !Object.keys(cloudData).length) return null
    return cloudData
  } catch (err) {
    console.warn('MenuSemanal: no se pudo leer Supabase, uso caché local.', err.message)
    return null
  }
}

function pushCloud(valueObj) {
  clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    try {
      const { error } = await supabase
        .from('app_state')
        .upsert({ id: ROW_ID, data: valueObj, updated_at: new Date().toISOString() })
      if (error) throw error
    } catch (err) {
      console.warn('MenuSemanal: no se pudo sincronizar con Supabase.', err.message)
    }
  }, DEBOUNCE_MS)
}

export const supabaseStorage = {
  async getItem(name) {
    const local = localStorage.getItem(name)
    const cloud = await fetchCloud()
    if (cloud) {
      const str = JSON.stringify(cloud)
      localStorage.setItem(name, str)
      return str
    }
    return local
  },
  setItem(name, value) {
    localStorage.setItem(name, value)
    try {
      pushCloud(JSON.parse(value))
    } catch {
      // valor no parseable: no se sincroniza, pero queda en localStorage
    }
  },
  removeItem(name) {
    localStorage.removeItem(name)
  },
}
