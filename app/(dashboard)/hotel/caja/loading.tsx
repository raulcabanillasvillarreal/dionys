export default function CajaLoading() {
  return (
    <div className="flex flex-col h-full p-4 gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="skeleton h-6 w-24 rounded-lg" />
          <div className="skeleton h-3.5 w-40 rounded" />
        </div>
        <div className="skeleton h-9 w-32 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-8 w-28 rounded-lg" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-gray-100">
          {[140, 100, 80, 80, 60].map((w, i) => (
            <div key={i} className="skeleton h-3 rounded" style={{ width: `${w}px` }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
            <div className="skeleton h-8 w-8 rounded-xl shrink-0" />
            <div className="skeleton h-3.5 w-32 rounded" />
            <div className="skeleton h-3 w-20 rounded ml-auto" />
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
