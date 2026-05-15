export default function ContactosLoading() {
  return (
    <div className="flex flex-col h-full p-4 gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="skeleton h-6 w-32 rounded-lg" />
          <div className="skeleton h-3.5 w-48 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-9 w-36 rounded-2xl" />
          <div className="skeleton h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex gap-4 px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
          {[180, 120, 100, 80, 70].map((w, i) => (
            <div key={i} className="skeleton h-3 rounded" style={{ width: `${w}px` }} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
            <div className="skeleton w-9 h-9 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="skeleton h-3.5 w-32 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
