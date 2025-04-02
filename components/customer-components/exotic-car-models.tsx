import Image from "next/image"
import { Car } from "lucide-react"
import { BackgroundLogo } from "./background-logo"

const exoticBrands = [
  {
    name: "Mercedes-Benz",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mercedes@2x-xsTlCrJWHhQwTNmkFAA69FbqKh0Xbh.png",
    models: ["S Series", "AMG Series", "Maybach", "C Class"],
  },
  {
    name: "Volvo",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/volvo@2x-ViTGi3NcClMqz9QRC0JIaRh2gOoTDw.png",
    models: ["All models"],
  },
  {
    name: "Porsche",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/porsche@2x-jPaATXmfNFVTUvFfLA4k74avLR7poh.png",
    models: ["718", "911", "Macan", "Boxsters", "Cayenne", "Panamera"],
  },
  {
    name: "BMW",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bmw@2x-RT8jblH6wWqLRXCb63Yu5De5LhoyGA.png",
    models: ["All models"],
  },
  {
    name: "Jaguar",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/jaguar@2x-eqfcwvIN4msSacDPJDnNqprXRSsek1.png",
    models: ["All models"],
  },
]

export function ExoticCarModels() {
  return (
    <section id="exotic-models" className="relative py-16 md:py-24 overflow-hidden">
      <BackgroundLogo position="right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-16">
          <span className="text-secondary">High Demand Repairs:</span>{" "}
          <span className="text-primary-dark">Our Most Serviced Exotics</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exoticBrands.map((brand) => (
            <div key={brand.name} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center">
                <div className="relative h-24 w-full mb-4">
                  <Image
                    src={brand.logo || "/placeholder.svg"}
                    alt={`${brand.name} logo`}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <h3 className="text-xl font-bold text-primary-dark mb-4">{brand.name}</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {brand.models.map((model) => (
                    <div key={model} className="flex items-center space-x-1 text-gray-600">
                      <Car className="h-4 w-4" />
                      <span>{model}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

