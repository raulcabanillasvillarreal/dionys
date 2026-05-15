export default function HotelLoading() {
  return (
    <div className="flex h-full gap-3 p-4 overflow-hidden animate-fade-in">
      {/* Kanban column skeletons */}
      {[3, 2, 4, 2, 1].map((cards, col) => (
        <div key={col} className="w-64 shrink-0 flex flex-col gap-2.5">
          {/* Column header */}
          <div className="flex items-center justify-between px-1 mb-1">
            <div className="skeleton h-4 w-24 rounded-full" />
            <div className="skeleton h-5 w-7 rounded-full" />
          </div>
          {/* Cards */}
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="skeleton h-3.5 w-28 rounded" />
                <div className="skeleton h-5 w-12 rounded-full" />
              </div>
              <div className="skeleton h-3 w-20 rounded" />
              <div className="flex items-center gap-2 pt-1">
                <div className="skeleton w-6 h-6 rounded-full" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
