import { useRouter } from "next/navigation"
import { Button } from "@/components/customer-components/ui/button"

interface ConfirmationPageProps {
  formData: any
  onBookAgain: () => void
}

export function ConfirmationPage({ formData, onBookAgain }: ConfirmationPageProps) {
  const router = useRouter()
  const reservationId = "#R00100" // In a real app, this would be generated by the backend

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1e4e8c] mb-4">{reservationId}</h2>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{`${formData.firstName} ${formData.lastName}`}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Car </p>
            <p className="font-medium">{`${formData.carBrand} ${formData.carModel}`}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Year Model</p>
            <p className="font-medium">{formData.yearModel}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Transmission</p>
            <p className="font-medium">{formData.transmission}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Fuel Type</p>
            <p className="font-medium">{formData.fuelType}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Odometer</p>
            <p className="font-medium">{formData.odometer}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Reservation Date</p>
          <p className="font-medium">{new Date(formData.reservationDate).toLocaleDateString()}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">General Services</p>
          <div className="flex flex-wrap gap-2">
            {formData.generalServices.map((service: string) => (
              <span key={service} className="px-2 py-1 bg-[#ebf8ff] text-[#1e4e8c] rounded-md text-sm">
                {service.split("_").join(" ").toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {formData.specificIssues && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Specific Issues</p>
            <p className="text-sm">{formData.specificIssues}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button onClick={onBookAgain} variant="outline" className="border-[#1e4e8c] text-[#1e4e8c]">
          Book Again
        </Button>
        <Button onClick={() => router.push("/customer/dashboard/reservations")} className="bg-[#1e4e8c] text-white">
          Go to Reservations
        </Button>
      </div>
    </div>
  )
}

