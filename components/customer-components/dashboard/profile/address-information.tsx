"use client"

import { useState } from "react"
import { Button } from "@/components/customer-components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Input } from "@/components/customer-components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customer-components/ui/select"
import { PencilIcon, XIcon } from "lucide-react"

// Philippine location data (simplified version)
const regions = ["Metro Manila", "Region IV-A (CALABARZON)", "Region III (Central Luzon)"] as const;
type RegionType = typeof regions[number];

// Define the type for the location hierarchy
type LocationHierarchy = {
  [region in RegionType]: {
    provinces: string[];
    cities: {
      [province: string]: string[];
    };
    municipalities: {
      [province: string]: string[];
    };
    cityZipCodes: {
      [city: string]: string;
    };
    municipalityZipCodes: {
      [municipality: string]: string;
    };
  };
};

// Location hierarchy
const locationHierarchy: LocationHierarchy = {
  "Metro Manila": {
    provinces: ["Metro Manila"],
    cities: {
      "Metro Manila": ["Manila", "Caloocan", "Makati", "Taguig", "Pasay", "Pasig"]
    },
    municipalities: {
      "Metro Manila": []
    },
    cityZipCodes: {
      "Manila": "1000",
      "Caloocan": "1400",
      "Makati": "1200",
      "Taguig": "1630",
      "Pasay": "1300",
      "Pasig": "1600"
    },
    municipalityZipCodes: {}
  },
  "Region IV-A (CALABARZON)": {
    provinces: ["Cavite", "Laguna", "Batangas", "Rizal", "Quezon"],
    cities: {
      "Cavite": ["Bacoor", "Dasmariñas", "Imus"],
      "Laguna": ["Biñan", "Calamba", "Santa Rosa"],
      "Rizal": ["Antipolo"],
      "Batangas": ["Batangas City", "Lipa"],
      "Quezon": ["Lucena"]
    },
    municipalities: {
      "Cavite": ["Kawit", "Carmona"],
      "Laguna": ["Los Baños", "Pagsanjan"],
      "Rizal": ["Cainta", "Taytay"],
      "Batangas": ["Nasugbu", "San Juan"],
      "Quezon": ["Sariaya", "Tayabas"]
    },
    cityZipCodes: {
      "Bacoor": "4102",
      "Dasmariñas": "4114",
      "Imus": "4103",
      "Biñan": "4024",
      "Calamba": "4027",
      "Santa Rosa": "4026",
      "Antipolo": "1870",
      "Batangas City": "4200",
      "Lipa": "4217",
      "Lucena": "4301"
    },
    municipalityZipCodes: {
      "Kawit": "4104",
      "Carmona": "4116",
      "Los Baños": "4030",
      "Pagsanjan": "4008",
      "Cainta": "1900",
      "Taytay": "1920",
      "Nasugbu": "4231",
      "San Juan": "4226",
      "Sariaya": "4322",
      "Tayabas": "4327"
    }
  },
  "Region III (Central Luzon)": {
    provinces: ["Bulacan", "Pampanga", "Nueva Ecija"],
    cities: {
      "Bulacan": ["Malolos", "Meycauayan"],
      "Pampanga": ["Angeles", "San Fernando"],
      "Nueva Ecija": ["Cabanatuan", "Palayan"]
    },
    municipalities: {
      "Bulacan": ["Bocaue", "Marilao"],
      "Pampanga": ["Apalit", "Porac"],
      "Nueva Ecija": ["Talavera", "Zaragoza"]
    },
    cityZipCodes: {
      "Malolos": "3000",
      "Meycauayan": "3020",
      "Angeles": "2009",
      "San Fernando": "2000",
      "Cabanatuan": "3100",
      "Palayan": "3132"
    },
    municipalityZipCodes: {
      "Bocaue": "3012",
      "Marilao": "3019",
      "Apalit": "2016",
      "Porac": "2008",
      "Talavera": "3114",
      "Zaragoza": "3110"
    }
  }
}

// Type for the form data
interface AddressFormData {
  region: string;
  province: string;
  city: string;
  municipality: string;
  zipCode: string;
  streetAddress: string;
}

export function AddressInformation() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<AddressFormData>({
    region: "Metro Manila",
    province: "Metro Manila",
    city: "Caloocan",
    municipality: "",
    zipCode: "1400",
    streetAddress: "123 Apple Street",
  })
  
  const [savedAddress, setSavedAddress] = useState<AddressFormData>({
    region: "Metro Manila",
    province: "Metro Manila",
    city: "Caloocan",
    municipality: "",
    zipCode: "1400",
    streetAddress: "123 Apple Street",
  })
  
  // States for managing dependent dropdowns
  const [availableProvinces, setAvailableProvinces] = useState<string[]>(
    formData.region && regions.includes(formData.region as RegionType) 
      ? locationHierarchy[formData.region as RegionType]?.provinces || []
      : []
  )
  const [availableCities, setAvailableCities] = useState<string[]>(
    formData.region && formData.province && regions.includes(formData.region as RegionType)
      ? locationHierarchy[formData.region as RegionType]?.cities[formData.province] || []
      : []
  )
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>(
    formData.region && formData.province && regions.includes(formData.region as RegionType)
      ? locationHierarchy[formData.region as RegionType]?.municipalities[formData.province] || []
      : []
  )

  // Handle region change and update provinces
  const handleRegionChange = (value: string) => {
    const newFormData = { ...formData, region: value }
    
    // Reset dependent fields
    newFormData.province = ""
    newFormData.city = ""
    newFormData.municipality = ""
    newFormData.zipCode = ""
    
    // Update available provinces
    const provinces = regions.includes(value as RegionType)
      ? locationHierarchy[value as RegionType]?.provinces || []
      : []
    setAvailableProvinces([...provinces])
    
    // Reset cities and municipalities
    setAvailableCities([])
    setAvailableMunicipalities([])
    
    setFormData(newFormData)
  }
  
  // Handle province change and update cities/municipalities
  const handleProvinceChange = (value: string) => {
    const newFormData = { ...formData, province: value }
    
    // Reset dependent fields
    newFormData.city = ""
    newFormData.municipality = ""
    newFormData.zipCode = ""
    
    // Update available cities and municipalities
    const cities = regions.includes(formData.region as RegionType)
      ? locationHierarchy[formData.region as RegionType]?.cities[value] || []
      : []
    const municipalities = regions.includes(formData.region as RegionType)
      ? locationHierarchy[formData.region as RegionType]?.municipalities[value] || []
      : []
    
    setAvailableCities([...cities])
    setAvailableMunicipalities([...municipalities])
    
    setFormData(newFormData)
  }
  
  // Handle city change and update zip code
  const handleCityChange = (value: string) => {
    const zipCode = regions.includes(formData.region as RegionType)
      ? locationHierarchy[formData.region as RegionType]?.cityZipCodes[value] || ""
      : ""
    
    setFormData({
      ...formData,
      city: value,
      municipality: "", // Clear municipality when city is selected
      zipCode: zipCode
    })
  }
  
  // Handle municipality change and update zip code
  const handleMunicipalityChange = (value: string) => {
    const zipCode = regions.includes(formData.region as RegionType)
      ? locationHierarchy[formData.region as RegionType]?.municipalityZipCodes[value] || ""
      : ""
    
    setFormData({
      ...formData,
      municipality: value,
      city: "", // Clear city when municipality is selected
      zipCode: zipCode
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    // Simulate API call with timeout
    setTimeout(() => {
      setSavedAddress({ ...formData })
      setIsEditing(false)
      setIsSaving(false)
    }, 800) // Simulated delay for API call
  }
  
  const handleCancel = () => {
    // Reset form to saved state
    setFormData({ ...savedAddress })
    setIsEditing(false)
  }
  
  const handleClear = () => {
    // Reset the form to empty values
    setFormData({
      region: "",
      province: "",
      city: "",
      municipality: "",
      zipCode: "",
      streetAddress: ""
    })
    
    // Reset available options
    setAvailableProvinces([])
    setAvailableCities([])
    setAvailableMunicipalities([])
  }

  // Display either city or municipality
  const displayCity = savedAddress.city || savedAddress.municipality || "-"

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#2A69AC]">ADDRESS</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="text-[#1A365D] hover:text-[#2A69AC] hover:bg-[#EBF8FF]"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>

        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-[#8B909A]">Region</dt>
            <dd className="text-[#1A365D]">{savedAddress.region || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Province</dt>
            <dd className="text-[#1A365D]">{savedAddress.province || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">City/Municipality</dt>
            <dd className="text-[#1A365D]">{displayCity}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Zip Code</dt>
            <dd className="text-[#1A365D]">{savedAddress.zipCode || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Street Address</dt>
            <dd className="text-[#1A365D]">{savedAddress.streetAddress || "-"}</dd>
          </div>
        </dl>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="region" className="text-sm font-medium">
                Region
              </label>
              <Select value={formData.region} onValueChange={handleRegionChange}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="province" className="text-sm font-medium">
                Province
              </label>
              <Select 
                value={formData.province} 
                onValueChange={handleProvinceChange}
                disabled={availableProvinces.length === 0}
              >
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select Province" />
                </SelectTrigger>
                <SelectContent>
                  {availableProvinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">
                  City
                </label>
                <Select 
                  value={formData.city} 
                  onValueChange={handleCityChange}
                  disabled={availableCities.length === 0}
                >
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="municipality" className="text-sm font-medium">
                  Municipality
                </label>
                <Select 
                  value={formData.municipality} 
                  onValueChange={handleMunicipalityChange}
                  disabled={availableMunicipalities.length === 0}
                >
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Select Municipality" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMunicipalities.map((municipality) => (
                      <SelectItem key={municipality} value={municipality}>
                        {municipality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="zipCode" className="text-sm font-medium">
                Zip Code
              </label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                readOnly
                className="bg-white/50 text-gray-600"
              />
              <p className="text-xs text-gray-500">ZIP code is automatically determined by city/municipality selection</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="streetAddress" className="text-sm font-medium">
                House No. & Street, Subdivision/Barangay
              </label>
              <Input
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                className="bg-white/50"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-[#EA5455] text-[#EA5455] hover:bg-[#EA5455]/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="border-[#718096] text-[#718096] hover:bg-[#718096]/10"
              >
                <XIcon className="mr-2 h-4 w-4" /> Clear
              </Button>
              <Button 
                type="submit" 
                className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}