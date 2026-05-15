export default function ReservasLoading() {
  return (
    <div className="flex flex-col h-full p-4 gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="skeleton h-6 w-28 rounded-lg" />
          <div className="skeleton h-3.5 w-44 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-9 w-36 rounded-2xl" />
          <div className="skeleton h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {[80, 90, 80, 72, 70].map((w, i) => (
          <div key={i} className="skeleton h-8 rounded-full" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex gap-4 px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
          {[140, 100, 80, 100, 80, 70].map((w, i) => (
            <div key={i} className="skeleton h-3 rounded" style={{ width: `${w}px` }} />
          ))}
        </div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
            <div className="skeleton h-3.5 w-32 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-4 w-16 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
