import { motion } from 'framer-motion'

export default function IconButton({ children, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={`inline-flex items-center justify-center rounded-full ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
