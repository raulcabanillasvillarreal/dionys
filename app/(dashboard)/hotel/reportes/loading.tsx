export default function ReportesLoading() {
  return (
    <div className="h-full overflow-y-auto animate-fade-in">
      <div className="p-4 md:p-6 space-y-5 pb-10">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="skeleton h-7 w-36 rounded-lg" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-gray-100 space-y-2 shadow-sm"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton w-7 h-7 rounded-xl" />
              </div>
              <div className="skeleton h-7 w-20 rounded-lg" />
              <div className="skeleton h-3 w-14 rounded" />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="skeleton h-5 w-40 rounded-lg" />
            <div className="skeleton h-60 rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="skeleton h-5 w-32 rounded-lg" />
            <div className="skeleton h-60 rounded-xl" />
          </div>
        </div>

        {/* Bottom chart */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="skeleton h-5 w-48 rounded-lg" />
          <div className="skeleton h-52 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
