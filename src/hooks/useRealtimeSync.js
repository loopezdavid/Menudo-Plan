import { useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { markRemoteApplied, lastPushedAt } from '../store/supabaseStorage'
import { useStore } from '../store/useStore'

const ROW_ID = 'default'

// Escucha cambios en tiempo real de la fila compartida en Supabase, para que
// si tienes la app abierta en dos dispositivos a la vez (móvil + PC, por
// ejemplo), el segundo vea al instante lo que ha guardado el primero, sin
// tener que recargar la página.
export function useRealtimeSync() {
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('app_state-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_state', filter: `id=eq.${ROW_ID}` },
        (payload) => {
          const incoming = payload.new?.data
          const state = incoming?.state
          if (!state || typeof state !== 'object') return
          // Es el eco de nuestra propia escritura: ya tenemos ese estado aplicado.
          if (payload.new.updated_at && payload.new.updated_at === lastPushedAt) return
          markRemoteApplied()
          useStore.setState(state)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
