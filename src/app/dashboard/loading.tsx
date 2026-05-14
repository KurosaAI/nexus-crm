export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
            <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 h-64" />
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 h-64" />
      </div>
    </div>
  )
}
