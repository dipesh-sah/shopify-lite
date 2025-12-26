/**
 * Blog Skeleton Loader Component
 * Loading placeholder for blog posts
 */

interface BlogSkeletonProps {
  count?: number;
}

export default function BlogSkeleton({ count = 6 }: BlogSkeletonProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8 animate-pulse" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: count }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                >
                  {/* Image Placeholder */}
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />

                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 animate-pulse" />

                    {/* Title */}
                    <div className="space-y-2 mb-4">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-4">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Categories Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4 animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            </div>

            {/* Tags Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4 animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
