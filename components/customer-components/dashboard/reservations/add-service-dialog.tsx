"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Button } from "@/components/customer-components/ui/button"
import { Checkbox } from "@/components/customer-components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { ChevronRight, ArrowLeft } from "lucide-react" 

interface Service {
  id: string
  label: string
}

const services: Service[] = [
  // General Auto Repair & Maintenance
  { id: "engine_diagnostics", label: "Engine diagnostics, tuning, and repairs" },
  { id: "oil_change_fluid", label: "Oil change, fluid checks, and filter replacements" },
  { id: "battery_inspection", label: "Battery inspection and replacement" },
  { id: "transmission_service", label: "Transmission service and repairs" },
  { id: "fuel_cooling_maintenance", label: "Fuel system and cooling system maintenance" },
  { id: "oil_change_filter", label: "Oil Change with or w/o Filter" },
  { id: "air_filter_replacement", label: "Air Filter Replacement" },
  { id: "pms", label: "PMS (Preventive Maintenance Service)" },
  { id: "engine_timing_repair", label: "Engine Timing Repair" },
  { id: "ENGINE_OVERHAUL", label: "ENGINE OVERHAUL" },
  { id: "ENGINE_TUNING", label: "ENGINE TUNING" },
  { id: "OIL_CHANGE", label: "OIL CHANGE" },
  
  // Brake & Suspension Services
  { id: "brake_inspection", label: "Brake inspection, cleaning, and replacement" },
  { id: "suspension_repairs", label: "Suspension system repairs and upgrades" },
  { id: "wheel_alignment", label: "Wheel alignment and balancing" },
  { id: "brakemaster_repair", label: "BrakeMaster Repair" },
  { id: "BRAKE_SHOES_CLEAN", label: "BRAKE SHOES CLEAN" },
  { id: "BRAKE_SHOES_REPLACE", label: "BRAKE SHOES REPLACE" },
  { id: "BRAKE_CLEAN", label: "BRAKE CLEAN" },
  { id: "BRAKE_REPLACE", label: "BRAKE REPLACE" },
  { id: "SUSPENSION_SYSTEMS", label: "SUSPENSION SYSTEMS" },
  
  // Body & Exterior Services
  { id: "paint_dent", label: "Paint jobs, dent removal, and scratch repair" },
  { id: "window_light", label: "Window, headlight, and taillight restoration" },
  { id: "rust_prevention", label: "Rust prevention and undercoating" },
  { id: "PAINT_JOBS", label: "PAINT JOBS" },
  
  // Tires & Wheels
  { id: "tire_replacement", label: "Tire replacement" },
  { id: "rim_repair", label: "Rim repair and refinishing" },
  
  // Electrical & Diagnostic Services
  { id: "computerized_diagnostics", label: "Computerized engine diagnostics" },
  { id: "alternator_starter", label: "Alternator, starter, and battery checks" },
  { id: "sensor_calibration", label: "Sensor calibration and replacement" },
  
  // Air Conditioning Services
  { id: "freon_recharging", label: "Freon Recharging" },
  { id: "compressor_repair", label: "Compressor Repair" },
  { id: "aircon_fan_repair", label: "Aircon Fan Repair" },
  { id: "evaporator_replacement", label: "Evaporator Replacement" },
  { id: "aircon_full_service", label: "Aircon Full Service" },
  { id: "compressor_assembly", label: "Compressor Assembly" },
  { id: "AIR_CONDITIONING", label: "AIR CONDITIONING" },
  
  // Performance & Customization
  { id: "exhaust_suspension_upgrades", label: "Exhaust system and suspension upgrades" },
  { id: "ecu_tuning", label: "ECU tuning and performance modifications" },
  
  // Emergency & Roadside Assistance
  { id: "towing_services", label: "Towing services and roadside assistance" },
  { id: "lockout_jumpstart", label: "Lockout, jumpstart, and flat tire services" },
  
  // Insurance & Inspection Services
  { id: "vehicle_inspection", label: "Vehicle inspection and repair estimates" },
  { id: "emissions_testing", label: "Emissions testing and compliance" },
]

const serviceCategories = [
  {
    id: "general",
    label: "General Auto Repair & Maintenance",
    services: ["engine_diagnostics", "oil_change_fluid", "battery_inspection", "transmission_service", 
               "fuel_cooling_maintenance", "oil_change_filter", "air_filter_replacement", "pms", 
               "engine_timing_repair", "ENGINE_OVERHAUL", "ENGINE_TUNING", "OIL_CHANGE"]
  },
  {
    id: "brake",
    label: "Brake & Suspension Services",
    services: ["brake_inspection", "suspension_repairs", "wheel_alignment", "brakemaster_repair",
               "BRAKE_SHOES_CLEAN", "BRAKE_SHOES_REPLACE", "BRAKE_CLEAN", "BRAKE_REPLACE", "SUSPENSION_SYSTEMS"]
  },
  {
    id: "body",
    label: "Body & Exterior Services",
    services: ["paint_dent", "window_light", "rust_prevention", "PAINT_JOBS"]
  },
  {
    id: "tires",
    label: "Tires & Wheels",
    services: ["tire_replacement", "rim_repair"]
  },
  {
    id: "electrical",
    label: "Electrical & Diagnostic Services",
    services: ["computerized_diagnostics", "alternator_starter", "sensor_calibration"]
  },
  {
    id: "air",
    label: "Air Conditioning Services",
    services: ["freon_recharging", "compressor_repair", "aircon_fan_repair", 
               "evaporator_replacement", "aircon_full_service", "compressor_assembly",
               "AIR_CONDITIONING"]
  },
  {
    id: "performance",
    label: "Performance & Customization",
    services: ["exhaust_suspension_upgrades", "ecu_tuning"]
  },
  {
    id: "emergency",
    label: "Emergency & Roadside Assistance",
    services: ["towing_services", "lockout_jumpstart"]
  },
  {
    id: "insurance",
    label: "Insurance & Inspection Services",
    services: ["vehicle_inspection", "emissions_testing"]
  }
]

interface AddServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (selectedServices: string[]) => void
  existingServices?: string[] // New prop to receive existing services
}

export function AddServiceDialog({
  open,
  onOpenChange,
  onConfirm,
  existingServices = [], // Default to empty array if not provided
}: AddServiceDialogProps) {
  const [selectedServices, setSelectedServices] = React.useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)

  // Improved normalize function for more consistent comparison
  const normalizeServiceName = (service: string) => {
    return service.trim().toUpperCase().replace(/_/g, " ");
  }

  // Improved check if a service already exists - handles case and format differences
  const isServiceExisting = (serviceId: string) => {
    const normalizedServiceId = normalizeServiceName(serviceId);
    return existingServices.some(existingService => 
      normalizeServiceName(existingService) === normalizedServiceId
    );
  }

  // Get selected count per category
  const getSelectedCountByCategory = (categoryId: string) => {
    const category = serviceCategories.find(cat => cat.id === categoryId);
    if (!category) return 0;
    
    return category.services.filter(serviceId => 
      selectedServices.includes(serviceId)
    ).length;
  }

  const handleServiceSelection = (serviceId: string, checked: boolean) => {
    if (checked) {
      // Check if service already exists in existing services with improved comparison
      if (isServiceExisting(serviceId)) {
        // Use toast if available, or fallback to alert
        if (typeof toast === 'function') {
          toast({
            title: "Service already exists",
            description: "This service is already added to the reservation.",
            variant: "destructive",
          })
        } else {
          alert("This service is already added to the reservation.");
        }
        return;
      }

      setSelectedServices((prev) => [...prev, serviceId]);
    } else {
      setSelectedServices((prev) => prev.filter((id) => id !== serviceId));
    }
  }

  const handleConfirm = () => {
    // Additional check before confirming with improved comparison
    const duplicates = selectedServices.filter(serviceId => isServiceExisting(serviceId));

    if (duplicates.length > 0) {
      // Use toast if available, or fallback to alert
      if (typeof toast === 'function') {
        toast({
          title: "Duplicate services found",
          description: "Some selected services are already in the reservation.",
          variant: "destructive",
        })
      } else {
        alert("Some selected services are already in the reservation.");
      }
      return;
    }

    onConfirm(selectedServices);
    setSelectedServices([]);
    setSelectedCategory(null);
    onOpenChange(false);
  }

  // Reset selected services when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setSelectedServices([]);
      setSelectedCategory(null);
    }
  }, [open]);

  // Get service object by ID
  const getServiceById = (id: string) => {
    return services.find(service => service.id === id);
  }

  // Get services for a category
  const getServicesForCategory = (categoryId: string) => {
    const category = serviceCategories.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    return category.services.map(serviceId => {
      return getServiceById(serviceId);
    }).filter(Boolean) as Service[];
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {selectedCategory ? 
              serviceCategories.find(cat => cat.id === selectedCategory)?.label : 
              "What services do you want to add?"}
          </DialogTitle>
        </DialogHeader>
        
        {/* Total services counter - always visible */}
        <div className="bg-blue-50 rounded-md p-2 mb-4 text-center text-blue-700 font-medium">
          Selected Services: {selectedServices.length}
        </div>
        
        {selectedCategory ? (
          // Service list view for selected category
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4 py-4">
              {getServicesForCategory(selectedCategory).map((service) => {
                if (!service) return null;
                
                const isExisting = isServiceExisting(service.id);
                
                return (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.id}
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={(checked) => {
                        handleServiceSelection(service.id, checked as boolean);
                      }}
                      disabled={isExisting} // Disable checkbox if service already exists
                    />
                    <label
                      htmlFor={service.id}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${
                        isExisting ? "text-gray-400" : ""
                      }`}
                    >
                      {service.label}
                      {isExisting && " (Already added)"}
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedCategory(null)}
                className="bg-[#FFE5E5] hover:bg-[#EA5455]/30 text-[#EA5455] hover:text-[#EA5455] flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                variant="outline"
                onClick={handleConfirm}
                disabled={selectedServices.length === 0}
                className="bg-[#E6FFF3] hover:bg-[#28C76F]/30 text-[#28C76F] hover:text-[#28C76F]"
              >
                Confirm ({selectedServices.length})
              </Button>
            </div>
          </div>
        ) : (
          // Categories list view - now in two columns with selection counts
          <div className="flex flex-col space-y-2 py-2">
            <div className="grid grid-cols-2 gap-4">
              {serviceCategories.map((category) => {
                const selectedCount = getSelectedCountByCategory(category.id);
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center justify-between p-3 text-left text-blue-700 bg-white border border-gray-200 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{category.label}</span>
                      {selectedCount > 0 && (
                        <span className="text-xs text-green-600 mt-1">
                          {selectedCount} selected
                        </span>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
            
            {selectedServices.length > 0 && (
              <div className="flex justify-center space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="bg-[#FFE5E5] hover:bg-[#EA5455]/30 text-[#EA5455] hover:text-[#EA5455]"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleConfirm}
                  className="bg-[#E6FFF3] hover:bg-[#28C76F]/30 text-[#28C76F] hover:text-[#28C76F]"
                >
                  Confirm ({selectedServices.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}