"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast" // Make sure you have this import

interface Service {
  id: string
  label: string
}

const services: Service[] = [
  { id: "PAINT JOBS", label: "PAINT JOBS" },
  { id: "BRAKE SHOES CLEAN", label: "BRAKE SHOES CLEAN" },
  { id: "ENGINE OVERHAUL", label: "ENGINE OVERHAUL" },
  { id: "SUSPENSION SYSTEMS", label: "SUSPENSION SYSTEMS" },
  { id: "BRAKE SHOES REPLACE", label: "BRAKE SHOES REPLACE" },
  { id: "BRAKE CLEAN", label: "BRAKE CLEAN" },
  { id: "ENGINE TUNING", label: "ENGINE TUNING" },
  { id: "AIR CONDITIONING", label: "AIR CONDITIONING" },
  { id: "BRAKE REPLACE", label: "BRAKE REPLACE" },
  { id: "OIL CHANGE", label: "OIL CHANGE" },
]

interface AddServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selectedServices: string[]) => void
  existingServices?: string[] // Add this prop to receive existing services
}

export function AddServiceDialog({
  open,
  onOpenChange,
  onConfirm,
  existingServices = [], // Default to empty array if not provided
}: AddServiceDialogProps) {
  const [selectedServices, setSelectedServices] = React.useState<string[]>([])

  const handleServiceSelection = (serviceId: string, checked: boolean) => {
    if (checked) {
      // Check if service already exists in existing services
      if (existingServices.includes(serviceId)) {
        toast({
          title: "Service already exists",
          description: "This service is already added to the reservation.",
          variant: "destructive",
        })
        return
      }

      setSelectedServices((prev) => [...prev, serviceId])
    } else {
      setSelectedServices((prev) => prev.filter((id) => id !== serviceId))
    }
  }

  const handleConfirm = () => {
    // Additional check before confirming
    const duplicates = selectedServices.filter((service) => existingServices.includes(service))

    if (duplicates.length > 0) {
      toast({
        title: "Duplicate services found",
        description: "Some selected services are already in the reservation.",
        variant: "destructive",
      })
      return
    }

    onConfirm(selectedServices.map((id) => id.split("_").join(" ").toUpperCase()))
    setSelectedServices([])
    onOpenChange(false)
  }

  // Reset selected services when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setSelectedServices([])
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">What services do you want to add?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {services.map((service) => (
            <div key={service.id} className="flex items-center space-x-2">
              <Checkbox
                id={service.id}
                checked={selectedServices.includes(service.id)}
                onCheckedChange={(checked) => {
                  handleServiceSelection(service.id, checked as boolean)
                }}
                disabled={existingServices.includes(service.id)} // Disable checkbox if service already exists
              />
              <label
                htmlFor={service.id}
                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${
                  existingServices.includes(service.id) ? "text-gray-400" : ""
                }`}
              >
                {service.label}
                {existingServices.includes(service.id) && " (Already added)"}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-6 py-2 rounded-lg bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] border-0 transition-colors"
          >
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handleConfirm}
            className="px-6 py-2 rounded-lg bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] border-0 transition-colors"
            disabled={selectedServices.length === 0}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

