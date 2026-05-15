export default function MapaLoading() {
  return (
    <div className="flex flex-col h-full p-4 gap-4 animate-fade-in">
      {/* Floor tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['Todos', 'P.1', 'P.2', 'P.3', 'P.4', 'P.5'].map((_, i) => (
          <div
            key={i}
            className="skeleton h-8 rounded-full"
            style={{ width: i === 0 ? '72px' : '48px' }}
          />
        ))}
        <div className="ml-auto skeleton h-8 w-48 rounded-full hidden md:block" />
      </div>

      {/* Stats bar */}
      <div className="flex gap-3">
        {[80, 72, 80].map((w, i) => (
          <div key={i} className="skeleton h-9 rounded-xl" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2 flex-1 content-start">
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={i}
            className="skeleton rounded-xl"
            style={{
              height: '96px',
              animationDelay: `${(i * 30) % 600}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
