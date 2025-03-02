import { Button } from "@/components/ui/button"

interface FormData {
  firstName: string
  lastName: string
  gender: string
  phoneNumber: string
  dateOfBirth: string
  streetAddress: string
  city: string
  province: string
  zipCode: string
  carModel: string
  yearModel: string
  transmission: string
  fuelType: string
  odometer: string
  services: string[]
  specificIssues: string
  reservationDate: string
}

export function ReviewDetails({
  formData,
  onBack,
  onSubmit,
}: {
  formData: FormData
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Review Your Booking</h2>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{`${formData.firstName} ${formData.lastName}`}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Gender</p>
            <p className="font-medium">{formData.gender}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Phone Number</p>
            <p className="font-medium">{formData.phoneNumber}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p className="font-medium">{formData.dateOfBirth}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Address</p>
          <p className="font-medium">{`${formData.streetAddress}, ${formData.city}, ${formData.province} ${formData.zipCode}`}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Car Model</p>
            <p className="font-medium">{formData.carModel}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Year Model</p>
            <p className="font-medium">{formData.yearModel}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Transmission</p>
            <p className="font-medium">{formData.transmission}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Fuel Type</p>
            <p className="font-medium">{formData.fuelType}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Odometer</p>
          <p className="font-medium">{formData.odometer}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Reservation Date</p>
          <p className="font-medium">
            {new Date(formData.reservationDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">General Services</p>
          <div className="flex flex-wrap gap-2">
            {formData.services.map((service: string) => (
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

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onBack} className="border-[#1e4e8c] text-[#1e4e8c]">
          Back
        </Button>
        <Button onClick={() => onSubmit()} className="bg-[#1e4e8c] text-white">
  Reserve
</Button>
      </div>
    </div>
  )
}

