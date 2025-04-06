"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/customer-components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Input } from "@/components/customer-components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customer-components/ui/select"
import { PencilIcon, XIcon } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/customer-components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Type definitions for location data
type Region = string;
type City = string;
type Municipality = string;
type Province = string;

interface LocationData {
  provinces: Province[]
  cities: {
    [province: string]: City[]
  }
  municipalities: {
    [province: string]: Municipality[]
  }
  cityZipCodes: {
    [city: string]: string
  }
  municipalityZipCodes: {
    [municipality: string]: string
  }
}

interface LocationHierarchy {
  [region: string]: LocationData
}

// Philippine location data
const philippineRegions: Region[] = [
  "Metro Manila",
  "Region III (Central Luzon)",
  "Region IV-A (CALABARZON)"
].sort();

// Location hierarchy with separate city and municipality data
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
};

// Address schema with validation
const addressSchema = z
  .object({
    region: z.string().min(1, "Region is required"),
    province: z.string().min(1, "Province is required"),
    city: z.string().optional(),
    municipality: z.string().optional(),
    zipCode: z.string().optional(),
    streetAddress: z.string().min(1, "Street address is required"),
  })
  .refine(
    (data) => {
      // If region is selected, province is required
      if (data.region) {
        return !!data.province;
      }
      return true;
    },
    {
      message: "Province is required",
      path: ["province"],
    }
  )
  .refine(
    (data) => {
      // If province is selected, either city or municipality must be selected
      const selectedProvince = data.province;
      const selectedRegion = data.region;
      
      if (selectedProvince && selectedRegion) {
        const hasCities = locationHierarchy[selectedRegion]?.cities[selectedProvince]?.length > 0;
        const hasMunicipalities = locationHierarchy[selectedRegion]?.municipalities[selectedProvince]?.length > 0;
        
        if (hasCities || hasMunicipalities) {
          return !!data.city || !!data.municipality;
        }
      }
      return true;
    },
    {
      message: "City or Municipality is required",
      path: ["city"],
    }
  )
  .refine(
    (data) => {
      // Only validate zipCode if city or municipality is selected
      if (data.city || data.municipality) {
        return data.zipCode ? /^\d{4}$/.test(data.zipCode) : false;
      }
      return true;
    },
    {
      message: "A valid ZIP code is required",
      path: ["zipCode"],
    }
  );

// Default empty address
const emptyAddress = {
  region: "",
  province: "",
  city: "",
  municipality: "",
  zipCode: "",
  streetAddress: ""
};

export function AddressInformation({ 
  userId, 
  initialAddress = emptyAddress 
}: { 
  userId?: string, 
  initialAddress?: z.infer<typeof addressSchema> 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  
  // Initialize with empty or provided address
  const [savedAddress, setSavedAddress] = useState<z.infer<typeof addressSchema>>(
    initialAddress || emptyAddress
  );

  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: savedAddress,
    mode: "onChange" // Validate on change for better user feedback
  });

  // Watch form values
  const currentRegion = form.watch("region");
  const currentProvince = form.watch("province");
  const currentCity = form.watch("city");
  const currentMunicipality = form.watch("municipality");

  // Update available provinces when region changes
  useEffect(() => {
    if (currentRegion && locationHierarchy[currentRegion]) {
      const provinces = locationHierarchy[currentRegion].provinces;
      setAvailableProvinces([...provinces].sort());
    }
  }, [currentRegion]);

  // Update cities and municipalities when province changes
  useEffect(() => {
    if (currentRegion && currentProvince) {
      const regionData = locationHierarchy[currentRegion];
      
      // Update cities
      if (regionData?.cities[currentProvince]) {
        const cities = regionData.cities[currentProvince];
        setAvailableCities([...cities].sort());
      } else {
        setAvailableCities([]);
      }
      
      // Update municipalities
      if (regionData?.municipalities[currentProvince]) {
        const municipalities = regionData.municipalities[currentProvince];
        setAvailableMunicipalities([...municipalities].sort());
      } else {
        setAvailableMunicipalities([]);
      }
    }
  }, [currentProvince, currentRegion]);

  // Update ZIP code when city changes
  useEffect(() => {
    if (currentCity && currentRegion) {
      // Safely access cityZipCodes with optional chaining
      const zipCode = locationHierarchy[currentRegion]?.cityZipCodes?.[currentCity];
      if (zipCode) {
        form.setValue("zipCode", zipCode);
      }
    }
  }, [currentCity, currentRegion, form]);

  // Update ZIP code when municipality changes
  useEffect(() => {
    if (currentMunicipality && currentRegion) {
      // Safely access municipalityZipCodes with optional chaining
      const zipCode = locationHierarchy[currentRegion]?.municipalityZipCodes?.[currentMunicipality];
      if (zipCode) {
        form.setValue("zipCode", zipCode);
      }
    }
  }, [currentMunicipality, currentRegion, form]);

  const handleSubmit = async (data: z.infer<typeof addressSchema>) => {
    // Clear any previous errors
    setSubmitError(null);
    setIsSaving(true);
    
    try {
      // Simulate API call with timeout
      setTimeout(() => {
        setSavedAddress({ ...data });
        setIsEditing(false);
        setIsSaving(false);
      }, 800); // Simulated delay for API call
    } catch (error) {
      console.error("Error updating address:", error);
      setSubmitError("Failed to update address. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleClear = () => {
    // Reset form to empty state
    form.reset(emptyAddress);
    
    // Reset available options
    setAvailableProvinces([]);
    setAvailableCities([]);
    setAvailableMunicipalities([]);
    
    // Clear any errors
    setSubmitError(null);
  };
  
  const handleCancel = () => {
    // Revert form to last saved state
    form.reset(savedAddress);
    setIsEditing(false);
    
    // Clear any errors
    setSubmitError(null);
  };

  // Memoized display values to improve performance
  const displayCity = savedAddress?.city || savedAddress?.municipality || "-";

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
            <dd className="text-[#1A365D]">{savedAddress?.region || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Province</dt>
            <dd className="text-[#1A365D]">{savedAddress?.province || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">City/Municipality</dt>
            <dd className="text-[#1A365D]">{displayCity}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Zip Code</dt>
            <dd className="text-[#1A365D]">{savedAddress?.zipCode || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Street Address</dt>
            <dd className="text-[#1A365D]">{savedAddress?.streetAddress || "-"}</dd>
          </div>
        </dl>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{submitError}</span>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <label htmlFor="region" className="text-sm font-medium">
                      Region
                    </label>
                    <Select 
                      onValueChange={(value) => {
                        // Handle region change explicitly
                        field.onChange(value);
                        
                        // Save the current street address
                        const streetAddress = form.getValues("streetAddress");
                        
                        // Clear dependent fields
                        form.setValue("province", "");
                        form.setValue("city", "");
                        form.setValue("municipality", "");
                        form.setValue("zipCode", "");
                        
                        // Update available provinces
                        if (locationHierarchy[value]) {
                          const provinces = locationHierarchy[value].provinces;
                          setAvailableProvinces([...provinces].sort());
                        } else {
                          setAvailableProvinces([]);
                        }
                        
                        // Clear available cities and municipalities
                        setAvailableCities([]);
                        setAvailableMunicipalities([]);
                        
                        // Restore the street address
                        form.setValue("streetAddress", streetAddress);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/50">
                          <SelectValue placeholder="Select Region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {philippineRegions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <label htmlFor="province" className="text-sm font-medium">
                      Province
                    </label>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        
                        // Clear city, municipality and zipCode when province changes
                        form.setValue("city", "");
                        form.setValue("municipality", "");
                        form.setValue("zipCode", "");
                        
                        // Update available cities and municipalities
                        if (currentRegion) {
                          const regionData = locationHierarchy[currentRegion];
                          
                          // Update cities
                          if (regionData?.cities[value]) {
                            const cities = regionData.cities[value];
                            setAvailableCities([...cities].sort());
                          } else {
                            setAvailableCities([]);
                          }
                          
                          // Update municipalities
                          if (regionData?.municipalities[value]) {
                            const municipalities = regionData.municipalities[value];
                            setAvailableMunicipalities([...municipalities].sort());
                          } else {
                            setAvailableMunicipalities([]);
                          }
                        }
                      }}
                      value={field.value}
                      disabled={availableProvinces.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/50">
                          <SelectValue placeholder="Select Province" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableProvinces.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <label htmlFor="city" className="text-sm font-medium">
                        City
                      </label>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear municipality when city is selected
                          form.setValue("municipality", "");
                          // Clear zip code so it can be set by the useEffect
                          form.setValue("zipCode", "");
                        }}
                        value={field.value}
                        disabled={availableCities.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/50">
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="municipality"
                  render={({ field }) => (
                    <FormItem>
                      <label htmlFor="municipality" className="text-sm font-medium">
                        Municipality
                      </label>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear city when municipality is selected
                          form.setValue("city", "");
                          // Clear zip code so it can be set by the useEffect
                          form.setValue("zipCode", "");
                        }}
                        value={field.value}
                        disabled={availableMunicipalities.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/50">
                            <SelectValue placeholder="Select Municipality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableMunicipalities.map((municipality) => (
                            <SelectItem key={municipality} value={municipality}>
                              {municipality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <label htmlFor="zipCode" className="text-sm font-medium">
                      ZIP Code
                    </label>
                    <FormControl>
                      <Input
                        id="zipCode"
                        placeholder="ZIP Code"
                        className="bg-white/50"
                        readOnly
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">ZIP code is automatically determined by city/municipality selection</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <label htmlFor="streetAddress" className="text-sm font-medium">
                      House No. & Street, Subdivision/Barangay
                    </label>
                    <FormControl>
                      <Input
                        id="streetAddress"
                        placeholder="Enter street address"
                        className="bg-white/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}