import Image from "next/image"

export function ProfileHeader() {
  return (
    <div className="flex items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="relative h-24 w-24">
        <Image
          src="/placeholder.svg?height=96&width=96"
          alt="Andrea Salazar"
          width={96}
          height={96}
          className="rounded-full object-cover"
        />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#1A365D]">Andrea Salazar</h2>
        <p className="text-[#8B909A]">andeng</p>
        <p className="text-sm text-[#8B909A]">#C00100</p>
      </div>
    </div>
  )
}

