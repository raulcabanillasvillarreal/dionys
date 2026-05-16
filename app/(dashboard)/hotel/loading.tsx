export default function HotelSelectorLoading() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Logo */}
      <div className="skeleton w-16 h-16 rounded-2xl mx-auto mb-4" />
      <div className="skeleton h-7 w-40 rounded-lg mx-auto mb-2" />
      <div className="skeleton h-4 w-56 rounded mx-auto mb-10" />

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
            <div className="skeleton h-6 w-14 rounded-full" />
            <div className="skeleton h-5 w-40 rounded" />
            <div className="skeleton h-3.5 w-full rounded" />
            <div className="skeleton h-3.5 w-3/4 rounded" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="skeleton w-3 h-3 rounded-sm" />
                  <div className="skeleton h-3 rounded" style={{ width: `${80 + j * 15}px` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
