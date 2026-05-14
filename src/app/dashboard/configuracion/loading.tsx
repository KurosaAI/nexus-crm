export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse max-w-2xl">
      <div className="space-y-2">
        <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      ))}
    </div>
  )
}
