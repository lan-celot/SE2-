"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"

const brandLogos = [
  {
    name: "Honda",
    svg: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame-28-5P9wurihiNe3RgnaWutdzA9BBYxZkM.svg",
  },
  {
    name: "Jaguar",
    svg: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame-27-fJhMcOut32oGbAdsQDEpNCGFxeidVP.svg",
  },
  {
    name: "Nissan",
    svg: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame-FPywS0m7RUQXD2kHzTMMZPC2NXZV4k.svg",
  },
  {
    name: "Volvo",
    svg: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame-26-91ye3fFMoySR7ha35XPW89unG4jNnp.svg",
  },
  {
    name: "Audi",
    svg: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame-24-LJaBrH4MtACLtAYUETbztQSNoD537T.svg",
  },
]

export function BrandLogoScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const scroll = () => {
      if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
        scrollContainer.scrollLeft = 0
      } else {
        scrollContainer.scrollLeft += 1
      }
    }

    const intervalId = setInterval(scroll, 30)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="w-full overflow-hidden bg-[#ebf8ff] py-8">
      <div ref={scrollRef} className="flex w-max gap-16 px-8" style={{ scrollBehavior: "smooth" }}>
        {/* Double the logos for seamless loop */}
        {[...brandLogos, ...brandLogos].map((brand, index) => (
          <div key={`${brand.name}-${index}`} className="flex items-center justify-center w-40 h-16">
            <Image
              src={brand.svg || "/placeholder.svg"}
              alt={brand.name}
              width={144}
              height={68}
              className="w-auto h-full object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

