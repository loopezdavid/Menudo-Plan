import { motion } from 'framer-motion'

export default function PrimaryButton({ children, className = '', disabled, ...props }) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}
