import { Check } from "lucide-react"
import { BackgroundLogo } from "./background-logo"

const services = {
  carMaintenance: {
    title: "Car Maintenance",
    items: [
      "Engine Tuning",
      "Change oil",
      "Overhaul",
      "Air Conditioning & Heating",
      "Diagnosis of Vehicle Malfunction",
    ],
  },
  brakes: {
    title: "Brakes",
    items: ["Clean brake pads", "Replace brake pads", "Clean brake shoes", "Replace brake shoes"],
  },
  body: {
    title: "Body",
    items: ["Paint Jobs"],
  },
  underchassis: {
    title: "Underchassis",
    items: ["Suspension Systems"],
  },
}

export function ServicesSection() {
  return (
    <section id="services" className="relative py-16 md:py-24 overflow-hidden">
      <BackgroundLogo position="right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-16">
          <span className="text-secondary">Ensuring Peak Performance:</span>{" "}
          <span className="text-primary-dark">Our Car Services</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(services).map(([key, service]) => (
            <div key={key} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-xl font-bold text-primary-dark mb-4">{service.title}</h3>
              <ul className="space-y-3">
                {service.items.map((item) => (
                  <li key={item} className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

