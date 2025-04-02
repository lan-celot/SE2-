"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Button } from "@/components/customer-components/ui/button"
import { Checkbox } from "@/components/customer-components/ui/checkbox"

interface Service {
  id: string
  label: string
}

const services: Service[] = [
  { id: "paint_jobs", label: "PAINT JOBS" },
  { id: "brake_shoes_clean", label: "BRAKE SHOES CLEAN" },
  { id: "engine_overhaul", label: "ENGINE OVERHAUL" },
  { id: "suspension_systems", label: "SUSPENSION SYSTEMS" },
  { id: "brake_shoes_replace", label: "BRAKE SHOES REPLACE" },
  { id: "brake_clean", label: "BRAKE CLEAN" },
  { id: "engine_tuning", label: "ENGINE TUNING" },
  { id: "air_conditioning", label: "AIR CONDITIONING" },
  { id: "brake_replace", label: "BRAKE REPLACE" },
  { id: "oil_change", label: "OIL CHANGE" },
]

interface AddServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selectedServices: string[]) => void
}

export function AddServiceDialog({ open, onOpenChange, onConfirm }: AddServiceDialogProps) {
  const [selectedServices, setSelectedServices] = React.useState<string[]>([])

  const handleConfirm = () => {
    onConfirm(selectedServices.map((id) => id.split("_").join(" ").toUpperCase()))
    setSelectedServices([])
    onOpenChange(false)
  }

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
                  setSelectedServices((prev) =>
                    checked ? [...prev, service.id] : prev.filter((id) => id !== service.id),
                  )
                }}
              />
              <label htmlFor={service.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                {service.label}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-[#FFE5E5] hover:bg-[#EA5455]/30 text-[#EA5455] hover:text-[#EA5455]"
          >
            Back
          </Button>
          <Button
            variant="outline"
            onClick={handleConfirm}
            className="bg-[#E6FFF3] hover:bg-[#28C76F]/30 text-[#28C76F] hover:text-[#28C76F]"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

