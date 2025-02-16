interface BackgroundLogoProps {
  position: "left" | "right"
  className?: string
}

export function BackgroundLogo({ position, className = "" }: BackgroundLogoProps) {
  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 ${
        position === "left" ? "-left-[200px] md:-left-[300px]" : "-right-[200px] md:-right-[300px]"
      } opacity-20 pointer-events-none -z-10 ${className}`}
    >
      <div className="relative w-[400px] md:w-[731px] h-[400px] md:h-[681px]">
        <svg
          width="731"
          height="681"
          viewBox="0 0 731 681"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Vector 1 */}
          <path
            d="M-80 0.794434V679.794H10.4401V298.601L202.625 679.794H338.285L21.7451 0.794434H-80Z"
            fill="#1572D3"
            fillOpacity="0.2"
            stroke="#1572D3"
            strokeOpacity="0.3"
          />
          {/* Vector 2 */}
          <path
            d="M1.45166 286.424L136.692 0.794434H271.933L69.072 417.338L1.45166 286.424Z"
            fill="#1572D3"
            fillOpacity="0.2"
            stroke="#1572D3"
            strokeOpacity="0.3"
            transform="translate(200,0)"
          />
          {/* Vector 3 */}
          <path
            d="M1.32666 1L317.65 680.294H464.515L645.271 275.032V680.294H730.001V1H645.271L391.083 513.321L136.894 1H1.32666Z"
            fill="#1572D3"
            fillOpacity="0.2"
            stroke="#1572D3"
            strokeOpacity="0.3"
          />
        </svg>
      </div>
    </div>
  )
}

