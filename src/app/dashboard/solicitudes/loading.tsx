export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-56 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
