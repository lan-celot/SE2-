"use client"

import { Button } from "@/components/customer-components/ui/button"
import { BackgroundLogo } from "./background-logo"
import { Calendar, Car, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

const bookingSteps = [
  {
    icon: CheckCircle,
    title: "Share car symptoms",
    description: "Describe your car's model and issues in detail",
  },
  {
    icon: Calendar,
    title: "Book repair date",
    description: "Select an available reservation date and book your car",
  },
  {
    icon: Car,
    title: "Bring car in",
    description: "Bring your car to our shop on your reserved day",
  },
]

export function BookingSection() {
  const router = useRouter()

  const handleBookNowClick = () => {
    const isAuthenticated = Cookies.get("isAuthenticated") === "true"

    if (isAuthenticated) {
      router.push("/customer/dashboard/book")
    } else {
      router.push("/admin/login")
    }
  }

  return (
    <section id="booking" className="relative py-16 md:py-24 overflow-hidden">
      <BackgroundLogo position="left" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-16">
          <span className="text-primary-dark">From diagnostics to fixes, book your</span>{" "}
          <span className="text-secondary">car's health check!</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {bookingSteps.map((step) => (
            <div key={step.title} className="flex flex-col items-center text-center p-6 bg-white/50 rounded-lg">
              <div className="mb-4 p-4 bg-primary/10 rounded-full">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary-dark mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-dark text-white px-12 py-6 text-xl font-semibold"
            onClick={handleBookNowClick}
          >
            Book Now
          </Button>
        </div>
      </div>
    </section>
  )
}

