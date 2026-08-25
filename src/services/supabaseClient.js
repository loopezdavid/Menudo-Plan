import { createClient } from '@supabase/supabase-js'

// Proyecto Supabase de MenuSemanal. La clave de abajo es la clave pública
// ("anon"/"publishable"): está pensada para ir en el código del cliente.
// El acceso real está protegido por políticas de RLS en la tabla
// `app_state`, que solo permiten leer/escribir la fila con id = 'default'
// (ver migración create_app_state_table). No es una clave secreta.
const SUPABASE_URL = 'https://bilkckarlvcmkmbdpcop.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbGtja2FybHZjbWttYmRwY29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NjYwNDcsImV4cCI6MjEwMzI0MjA0N30.Ayo3SiwNzdrw7FHxUZXz49HL8VySi24FNc253KR8alQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
