import { Clock, Users, Car, Shield } from "lucide-react"
import { BackgroundLogo } from "./background-logo"
import Image from "next/image"

const features = [
  {
    icon: Clock,
    title: "Working on cars for more than 27 years",
    description: "With decades of experience, we ensure your car is in expert hands.",
  },
  {
    icon: Users,
    title: "Hired skilled mechanics",
    description: "Our team consists of highly skilled mechanics dedicated to providing top-notch service.",
  },
  {
    icon: Car,
    title: "Fixed compact to exotic cars",
    description: "From compact cars to exotic vehicles, we have successfully repaired a wide range of automobiles.",
  },
  {
    icon: Shield,
    title: "Treat vehicles like it's ours",
    description: "We handle every vehicle with the utmost care, treating it as if it were our own.",
  },
]

const experts = [
  {
    name: "Mar",
    location: "From Makati, PH",
    quote: "Meeting the customer's need is my top 1 priority.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample_man_pic-e31PmdXvRYFupe6JgqRHI07eh8pul8.png",
  },
  {
    name: "Nor",
    location: "From Makati, PH",
    quote: "Meeting the customer's need is my top 1 priority.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample_man_pic-e31PmdXvRYFupe6JgqRHI07eh8pul8.png",
  },
]

export function AboutUsSection() {
  return (
    <section id="about" className="relative py-16 md:py-24 overflow-hidden">
      <BackgroundLogo position="left" className="-z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h2 className="text-4xl md:text-3xl font-bold text-primary-dark mb-12">
              We offer the best repairs in town!
            </h2>
            <div className="space-y-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary-dark mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[400px] lg:h-[600px]">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gtr%20car-ZBbiknPR8nBiJkPN69iY2vvrYvk7oQ.png"
              alt="Blue Nissan GTR"
              fill
              style={{ objectFit: "contain" }}
              priority
              className="drop-shadow-xl"
            />
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            <span className="text-primary-dark">Meet the Experts</span>{" "}
            <span className="text-secondary">Keeping Your Car in Top Gear!</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {experts.map((expert, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow p-6"
            >
              <div className="aspect-[4/3] relative mb-4">
                <Image
                  src={expert.image || "/placeholder.svg"}
                  alt={`${expert.name} working on a car`}
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-2xl"
                />
              </div>
              <blockquote className="text-lg text-gray-600 mb-4">"{expert.quote}"</blockquote>
              <div>
                <h3 className="text-xl font-semibold text-primary-dark">{expert.name}</h3>
                <p className="text-gray-500">{expert.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

