export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A365D] mx-auto"></div>
        <p className="mt-2 text-[#1A365D]">Loading...</p>
      </div>
    </div>
  )
}

