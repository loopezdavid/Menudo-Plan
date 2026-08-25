export default function IconButton({ children, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full transition active:scale-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
