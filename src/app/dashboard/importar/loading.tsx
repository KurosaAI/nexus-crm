export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-44 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-4 w-60 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
          <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
