export default function InboxLoading() {
  return (
    <div className="flex h-full overflow-hidden animate-fade-in">
      {/* Conversation list */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col bg-white border-r border-gray-200">
        {/* Header */}
        <div className="px-4 pt-5 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="skeleton h-6 w-28 rounded-lg" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
          <div className="skeleton h-10 rounded-2xl" />
          {/* Channel tabs */}
          <div className="flex gap-1.5">
            {[20, 24, 22, 20, 16].map((w, i) => (
              <div key={i} className={`skeleton h-7 w-${w} rounded-full`} style={{ width: `${w * 4}px` }} />
            ))}
          </div>
        </div>

        {/* Conversation items */}
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-gray-100/80">
              <div className="skeleton w-11 h-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <div className="skeleton h-3.5 w-28 rounded" />
                  <div className="skeleton h-3 w-10 rounded" />
                </div>
                <div className="skeleton h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area — empty state skeleton */}
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="skeleton w-20 h-20 rounded-full" />
        <div className="skeleton h-4 w-40 rounded-lg" />
        <div className="skeleton h-3 w-56 rounded-lg" />
        <div className="flex gap-2 mt-2">
          {['WhatsApp', 'Instagram', 'Facebook', 'Email'].map(ch => (
            <div key={ch} className="skeleton h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
