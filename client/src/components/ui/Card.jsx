export default function Card({ children, className = '', padding = true, hover = false }) {
  return (
    <div
      className={[
        'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card',
        padding ? 'p-6' : '',
        hover ? 'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
