import Image from "next/image"

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          // These CSS variables can be adjusted for fine positioning
          "--bg-x-offset": "-40px",
          "--bg-y-offset": "0px",
        }}
      >
        <svg
          className="absolute right-[var(--bg-x-offset)] top-[var(--bg-y-offset)] h-auto w-[877px]"
          width="877"
          height="682"
          viewBox="0 0 877 682"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g opacity="0.3">
            <path
              d="M1 1.79443V680.794H91.4401V299.601L283.625 680.794H419.285L102.745 1.79443H1Z"
              fill="#1572D3"
              fillOpacity="0.2"
              stroke="#1572D3"
              strokeOpacity="0.3"
            />
            <path
              d="M475.452 287.424L610.692 1.79443H745.933L543.072 418.338L475.452 287.424Z"
              fill="#1572D3"
              fillOpacity="0.2"
              stroke="#1572D3"
              strokeOpacity="0.3"
            />
            <path
              d="M147.327 1L463.65 680.294H610.515L791.271 275.032V680.294H876.001V1H791.271L537.083 513.321L282.894 1H147.327Z"
              fill="#1572D3"
              fillOpacity="0.2"
              stroke="#1572D3"
              strokeOpacity="0.3"
            />
          </g>
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              <span className="text-[#1A365D]">Sharing your Pride</span>
              <br />
              <span className="text-[#1A365D] mt-4 block">
                <span>to your</span> <span className="text-[#2A69AC]">Ride</span>
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-lg">
              Experience seamless car care: book repairs and check-ups with us!
            </p>
          </div>
          <div className="relative h-[300px] md:h-[400px] lg:h-[500px]">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fortuner-CO3sosHIImWQrLbJQuiElD0WsY5A4K.png"
              alt="Blue Toyota Fortuner SUV"
              fill
              style={{ objectFit: "contain" }}
              priority
              className="drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

