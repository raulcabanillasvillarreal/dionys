export default function AgendaLoading() {
  return (
    <div className="flex flex-col h-full p-4 gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <div className="skeleton w-9 h-9 rounded-xl" />
          <div className="skeleton h-6 w-32 rounded-lg" />
          <div className="skeleton w-9 h-9 rounded-xl" />
        </div>
        <div className="skeleton h-9 w-36 rounded-xl" />
      </div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-8 rounded-lg" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1 content-start">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="skeleton rounded-xl"
            style={{ height: '72px', animationDelay: `${(i * 20) % 600}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
