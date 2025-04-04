import { Check } from "lucide-react"
import { BackgroundLogo } from "./background-logo"

const services = {
  generalMaintenance: {
    title: "General Auto Repair & Maintenance",
    items: [
      "Engine diagnostics, tuning, and repairs",
      "Oil change, fluid checks, and filter replacements",
      "Battery inspection and replacement",
      "Transmission service and repairs",
      "Fuel system and cooling system maintenance",
      "Oil Change with or w/o Filter",
      "Air Filter Replacement",
      "PMS (Preventive Maintenance Service)",
      "Engine Timing Repair",
    ],
  },
  brakeSuspension: {
    title: "Brake & Suspension Services",
    items: [
      "Brake inspection, cleaning, and replacement",
      "Suspension system repairs and upgrades",
      "Wheel alignment and balancing",
      "BrakeMaster Repair",
    ],
  },
  bodyExterior: {
    title: "Body & Exterior Services",
    items: [
      "Paint jobs, dent removal, and scratch repair",
      "Window, headlight, and taillight restoration",
      "Rust prevention and undercoating",
    ],
  },
  tiresWheels: {
    title: "Tires & Wheels",
    items: ["Tire replacement", "Rim repair and refinishing"],
  },
  electricalDiagnostic: {
    title: "Electrical & Diagnostic Services",
    items: [
      "Computerized engine diagnostics",
      "Alternator, starter, and battery checks",
      "Sensor calibration and replacement",
    ],
  },
  airConditioning: {
    title: "Air Conditioning Services",
    items: [
      "Freon Recharging",
      "Compressor Repair",
      "Aircon Fan Repair",
      "Evaporator Replacement",
      "Aircon Full Service",
      "Compressor Assembly",
    ],
  },
  performance: {
    title: "Performance & Customization",
    items: ["Exhaust system and suspension upgrades", "ECU tuning and performance modifications"],
  },
  emergency: {
    title: "Emergency & Roadside Assistance",
    items: ["Towing services and roadside assistance", "Lockout, jumpstart, and flat tire services"],
  },
  insurance: {
    title: "Insurance & Inspection Services",
    items: ["Vehicle inspection and repair estimates", "Emissions testing and compliance"],
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

