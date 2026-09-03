import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'

export default function Sheet({ open, onClose, title, children, footer, maxHeight = '86svh' }) {
  const dragControls = useDragControls()

  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="relative flex flex-col w-full sm:max-w-md sm:mx-auto bg-surface rounded-t-3xl shadow-pop overflow-hidden"
            style={{ maxHeight }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose()
            }}
          >
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-center pt-2.5 pb-1.5 px-8 shrink-0 touch-none cursor-grab active:cursor-grabbing"
            >
              <div className="h-1.5 w-10 rounded-full bg-border" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 pt-1 shrink-0">
                <h2 className="text-lg font-semibold text-text">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 -mr-1.5 rounded-full text-text-muted hover:bg-surface-2 active:scale-95 transition"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto grow px-5 safe-bottom">{children}</div>
            {footer && <div className="shrink-0 px-5 pt-3 pb-5 safe-bottom border-t border-border bg-surface">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
