import Image from "next/image"
import { Car } from "lucide-react"
import { BackgroundLogo } from "./background-logo"

const carBrands = [
  {
    name: "Toyota",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/toyota-1@2x-9cs1FqUAhiwCeQEvjKag0fzsWaKrD3.png",
    models: ["Fortuner", "Corolla"],
  },
  {
    name: "Honda",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/honda-1@2x-3vimv0BI8NNyjN5CbfCmiUdSKmSx9F.png",
    models: ["City", "Civic"],
  },
  {
    name: "Chevrolet",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/chev-1@2x-Rx7y4Lbmf7Prc53K5dY2Lcildr9zzg.png",
    models: ["Trailblazer"],
  },
  {
    name: "Mitsubishi",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mitsu-1@2x-qUr64aoaR3haxZn59Ka0DqfyXjMToY.png",
    models: ["Montero", "Pajero"],
  },
  {
    name: "Mazda",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mazda-1@2x-hWVbJoYj9BwFshaHPcaDcY5Bx35fei.png",
    models: ["All models"],
  },
]

export function CarModels() {
  return (
    <section id="car-models" className="relative py-16 md:py-24 overflow-hidden">
      <BackgroundLogo position="left" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-16">
          <span className="text-secondary">High Demand Repairs:</span>{" "}
          <span className="text-primary-dark">Our Most Serviced Cars</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {carBrands.map((brand) => (
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

