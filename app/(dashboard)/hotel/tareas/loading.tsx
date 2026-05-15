export default function TareasLoading() {
  return (
    <div className="flex flex-col h-full p-4 gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-24 rounded-lg" />
        <div className="skeleton h-9 w-32 rounded-xl" />
      </div>
      <div className="flex gap-2">
        {[60, 80, 72, 68].map((w, i) => (
          <div key={i} className="skeleton h-8 rounded-full" style={{ width: `${w}px` }} />
        ))}
      </div>
      <div className="flex-1 space-y-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="skeleton w-5 h-5 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-48 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
