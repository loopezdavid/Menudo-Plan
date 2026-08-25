import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function useTheme() {
  const themeMode = useStore((s) => s.settings.themeMode)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    if (themeMode === 'dark') root.classList.add('dark')
    else if (themeMode === 'light') root.classList.add('light')
  }, [themeMode])

  return themeMode
}
