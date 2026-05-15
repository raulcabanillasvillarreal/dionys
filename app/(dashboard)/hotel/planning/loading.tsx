export default function PlanningLoading() {
  return (
    <div className="flex flex-col h-full p-4 gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-36 rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton h-9 w-9 rounded-xl" />
          <div className="skeleton h-9 w-44 rounded-xl" />
          <div className="skeleton h-9 w-9 rounded-xl" />
        </div>
      </div>

      {/* Gantt grid */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
        {/* Room labels */}
        <div className="w-36 shrink-0 border-r border-gray-100">
          <div className="h-10 border-b border-gray-100 skeleton rounded-none" />
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center px-3 h-12 border-b border-gray-50 gap-2">
              <div className="skeleton w-7 h-5 rounded" />
              <div className="skeleton h-3 flex-1 rounded" />
            </div>
          ))}
        </div>
        {/* Timeline */}
        <div className="flex-1 overflow-hidden">
          <div className="flex h-10 border-b border-gray-100">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex-1 border-r border-gray-100 flex items-center justify-center">
                <div className="skeleton h-3 w-6 rounded" />
              </div>
            ))}
          </div>
          {Array.from({ length: 12 }).map((_, row) => (
            <div key={row} className="flex h-12 border-b border-gray-50">
              {Array.from({ length: 14 }).map((_, col) => (
                <div key={col} className="flex-1 border-r border-gray-50/60 p-0.5">
                  {(row + col) % 7 === 0 && (
                    <div className="skeleton h-full rounded-lg opacity-60" style={{ animationDelay: `${(row * col * 50) % 800}ms` }} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
