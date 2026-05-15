export default function PosLoading() {
  return (
    <div className="flex h-full gap-0 animate-fade-in">
      {/* Products grid */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-8 rounded-full" style={{ width: `${60 + i * 8}px` }} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
              <div className="skeleton h-12 w-12 rounded-xl mx-auto" />
              <div className="skeleton h-3.5 w-24 rounded mx-auto" />
              <div className="skeleton h-5 w-16 rounded-lg mx-auto" />
            </div>
          ))}
        </div>
      </div>
      {/* Cart panel */}
      <div className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col p-4 gap-3">
        <div className="skeleton h-5 w-20 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center py-2 border-b border-gray-100">
            <div className="skeleton w-8 h-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-3 w-12 rounded" />
            </div>
            <div className="skeleton h-4 w-12 rounded" />
          </div>
        ))}
        <div className="mt-auto space-y-3">
          <div className="skeleton h-5 w-full rounded" />
          <div className="skeleton h-11 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
