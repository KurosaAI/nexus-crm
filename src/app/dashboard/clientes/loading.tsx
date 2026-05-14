export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="flex gap-2 mt-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b-2 border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 dark:border-gray-700/50">
            <div className="grid grid-cols-6 gap-4 items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
