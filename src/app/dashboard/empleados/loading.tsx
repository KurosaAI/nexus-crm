export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-4 w-52 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl" />
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b-2 border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
