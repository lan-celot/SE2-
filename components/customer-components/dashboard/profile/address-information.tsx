"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/customer-components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Input } from "@/components/customer-components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/customer-components/ui/select"
import { PencilIcon, XIcon } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/customer-components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase" // Adjust the import path to your Firebase config
import { getAuth, onAuthStateChanged } from "firebase/auth"

// Type definitions for location data
type Region = string
type City = string
type Municipality = string
type Province = string

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
  "Region I (Ilocos Region)",
  "Region II (Cagayan Valley)",
  "Region III (Central Luzon)",
  "Region IV-A (CALABARZON)",
  "Region IV-B (MIMAROPA)",
  "Region V (Bicol Region)",
  "Region VI (Western Visayas)",
  "Region VII (Central Visayas)",
  "Region VIII (Eastern Visayas)",
  "Region IX (Zamboanga Peninsula)",
  "Region X (Northern Mindanao)",
  "Region XI (Davao Region)",
  "Region XII (SOCCSKSARGEN)",
  "Region XIII (Caraga)",
  "National Capital Region (NCR)",
  "Cordillera Administrative Region (CAR)",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
].sort()

// Location Hierarchy with separate city and municipality data
const locationHierarchy: LocationHierarchy = {
  "Region I (Ilocos Region)": {
    provinces: ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
    cities: {
      "Ilocos Norte": ["Laoag", "Batac"],
      "Ilocos Sur": ["Vigan", "Candon"],
      "La Union": ["San Fernando"],
      Pangasinan: ["Dagupan", "Alaminos", "San Carlos", "Urdaneta"],
    },
    municipalities: {
      "Ilocos Norte": ["Paoay", "Pagudpud"],
      "Ilocos Sur": ["Bantay", "Narvacan"],
      "La Union": ["Agoo", "Bauang"],
      Pangasinan: [],
    },
    cityZipCodes: {
      Laoag: "2900",
      Batac: "2906",
      Vigan: "2700",
      Candon: "2713",
      "San Fernando": "2500",
      Dagupan: "2400",
      Alaminos: "2404",
      "San Carlos": "2420",
      Urdaneta: "2428",
    },
    municipalityZipCodes: {
      Paoay: "2909",
      Pagudpud: "2919",
      Bantay: "2728",
      Narvacan: "2712",
      Agoo: "2508",
      Bauang: "2501",
    },
  },
  // Add more regions here as needed
}

// Updated schema with proper validation chain
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
        return !!data.province
      }
      return true
    },
    {
      message: "Province is required",
      path: ["province"],
    },
  )
  .refine(
    (data) => {
      // If province is selected, either city or municipality must be selected
      const selectedProvince = data.province
      const selectedRegion = data.region

      if (selectedProvince && selectedRegion) {
        const hasCities = locationHierarchy[selectedRegion]?.cities[selectedProvince]?.length > 0
        const hasMunicipalities = locationHierarchy[selectedRegion]?.municipalities[selectedProvince]?.length > 0

        if (hasCities || hasMunicipalities) {
          return !!data.city || !!data.municipality
        }
      }
      return true
    },
    {
      message: "City or Municipality is required",
      path: ["city"],
    },
  )
  .refine(
    (data) => {
      // Only validate zipCode if city or municipality is selected
      if (data.city || data.municipality) {
        return data.zipCode ? /^\d{4}$/.test(data.zipCode) : false
      }
      return true
    },
    {
      message: "A valid ZIP code is required",
      path: ["zipCode"],
    },
  )

// Default empty address
const emptyAddress = {
  region: "",
  province: "",
  city: "",
  municipality: "",
  zipCode: "",
  streetAddress: "",
}

export function AddressInformation({
  userId: providedUserId,
  initialAddress = emptyAddress, // Provide default value
}: {
  userId?: string
  initialAddress?: z.infer<typeof addressSchema>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([])

  // State for the effective userId (from props or auth)
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(providedUserId || null)

  // Auth state loading
  const [authLoading, setAuthLoading] = useState(!providedUserId)

  // Initialize with empty or provided address
  const [savedAddress, setSavedAddress] = useState<z.infer<typeof addressSchema>>(initialAddress || emptyAddress)

  // Add loading state to show feedback when saving
  const [isSaving, setIsSaving] = useState(false)

  // Add error state for displaying form submission errors
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [showEditConfirmation, setShowEditConfirmation] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Get current user from Firebase Auth if userId is not provided
  useEffect(() => {
    if (providedUserId) {
      setEffectiveUserId(providedUserId)
      setAuthLoading(false)
      return
    }

    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEffectiveUserId(user.uid)
        // Try to load user's address if not provided
        if (!initialAddress || Object.values(initialAddress).every((v) => !v)) {
          loadUserAddress(user.uid)
        }
      } else {
        setEffectiveUserId(null)
      }
      setAuthLoading(false)
    })

    return () => unsubscribe() // Clean up the subscription
  }, [providedUserId, initialAddress])

  // Function to load address data from Firestore
  const loadUserAddress = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists() && userDoc.data().address) {
        const addressData = userDoc.data().address
        setSavedAddress(addressData)
        form.reset(addressData)
      }
    } catch (error) {
      console.error("Error loading user address:", error)
    }
  }

  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: savedAddress || emptyAddress,
    mode: "onChange", // Validate on change for better user feedback
  })

  // Watch form values
  const currentRegion = form.watch("region")
  const currentProvince = form.watch("province")
  const currentCity = form.watch("city")
  const currentMunicipality = form.watch("municipality")

  // Update available provinces when region changes
  useEffect(() => {
    if (currentRegion && locationHierarchy[currentRegion]) {
      const provinces = locationHierarchy[currentRegion].provinces
      setAvailableProvinces([...provinces].sort())
    }
  }, [currentRegion])

  // Update cities and municipalities when province changes
  useEffect(() => {
    if (currentRegion && currentProvince) {
      const regionData = locationHierarchy[currentRegion]

      // Update cities
      if (regionData?.cities[currentProvince]) {
        const cities = regionData.cities[currentProvince]
        setAvailableCities([...cities].sort())
      } else {
        setAvailableCities([])
      }

      // Update municipalities
      if (regionData?.municipalities[currentProvince]) {
        const municipalities = regionData.municipalities[currentProvince]
        setAvailableMunicipalities([...municipalities].sort())
      } else {
        setAvailableMunicipalities([])
      }
    }
  }, [currentProvince, currentRegion])

  // Update ZIP code when city changes
  useEffect(() => {
    if (currentCity && currentRegion) {
      // Safely access cityZipCodes with optional chaining
      const zipCode = locationHierarchy[currentRegion]?.cityZipCodes?.[currentCity]
      if (zipCode) {
        form.setValue("zipCode", zipCode)
      }
    }
  }, [currentCity, currentRegion, form])

  // Update ZIP code when municipality changes
  useEffect(() => {
    if (currentMunicipality && currentRegion) {
      // Safely access municipalityZipCodes with optional chaining
      const zipCode = locationHierarchy[currentRegion]?.municipalityZipCodes?.[currentMunicipality]
      if (zipCode) {
        form.setValue("zipCode", zipCode)
      }
    }
  }, [currentMunicipality, currentRegion, form])

  const handleSubmit = async (data: z.infer<typeof addressSchema>) => {
    // Clear any previous errors
    setSubmitError(null)
    setIsSaving(true)

    try {
      // Simulate API call with timeout
      setTimeout(() => {
        setSavedAddress({ ...data })
        setIsEditing(false)
        setIsSaving(false)
        setShowSuccessMessage(true)

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false)
        }, 3000)
      }, 800) // Simulated delay for API call
    } catch (error) {
      console.error("Error updating address:", error)
      setSubmitError("Failed to update address. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = () => {
    // Reset form to empty state
    form.reset(emptyAddress)

    // Reset available options
    setAvailableProvinces([])
    setAvailableCities([])
    setAvailableMunicipalities([])

    // Clear any errors
    setSubmitError(null)
  }

  const handleCancel = () => {
    // Revert form to last saved state
    form.reset(savedAddress)
    setIsEditing(false)

    // Clear any errors
    setSubmitError(null)
  }

  // Show login message if no userId
  if (!authLoading && !effectiveUserId) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-[#2A69AC] mb-4">ADDRESS INFORMATION</h3>
          <p className="text-[#1A365D] mb-4">You need to be logged in to view and edit your address information.</p>
          <Button className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]">Sign In</Button>
        </div>
      </div>
    )
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#2A69AC]">ADDRESS</h3>
        </div>
        <div className="py-6 text-center">
          <p className="text-[#718096]">Loading address information...</p>
        </div>
      </div>
    )
  }

  // Memoized display values to improve performance
  const displayCity = savedAddress?.city || savedAddress?.municipality || "-"

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {showSuccessMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 mx-6 mt-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Address updated successfully!</p>
            </div>
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#2A69AC]">ADDRESS</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEditConfirmation(true)}
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

          <div className="text-sm text-muted-foreground mt-2 p-3 bg-blue-50 rounded-md border border-blue-100">
            <h4 className="font-medium text-blue-700 mb-1">Address Editing Rules:</h4>
            <ul className="list-disc pl-5 space-y-1 text-blue-600">
              <li>Select your region first, then province</li>
              <li>Choose either a city OR municipality (not both)</li>
              <li>ZIP code is automatically determined based on your selection</li>
              <li>Street address should include house number, street name, and barangay</li>
            </ul>
          </div>

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
                        field.onChange(value)

                        // Save the current street address
                        const streetAddress = form.getValues("streetAddress")

                        // Clear dependent fields
                        form.setValue("province", "")
                        form.setValue("city", "")
                        form.setValue("municipality", "")
                        form.setValue("zipCode", "")

                        // Update available provinces
                        if (locationHierarchy[value]) {
                          const provinces = locationHierarchy[value].provinces
                          setAvailableProvinces([...provinces].sort())
                        } else {
                          setAvailableProvinces([])
                        }

                        // Clear available cities and municipalities
                        setAvailableCities([])
                        setAvailableMunicipalities([])

                        // Restore the street address
                        form.setValue("streetAddress", streetAddress)
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
                        field.onChange(value)

                        // Clear city, municipality and zipCode when province changes
                        form.setValue("city", "")
                        form.setValue("municipality", "")
                        form.setValue("zipCode", "")

                        // Update available cities and municipalities
                        if (currentRegion) {
                          const regionData = locationHierarchy[currentRegion]

                          // Update cities
                          if (regionData?.cities[value]) {
                            const cities = regionData.cities[value]
                            setAvailableCities([...cities].sort())
                          } else {
                            setAvailableCities([])
                          }

                          // Update municipalities
                          if (regionData?.municipalities[value]) {
                            const municipalities = regionData.municipalities[value]
                            setAvailableMunicipalities([...municipalities].sort())
                          } else {
                            setAvailableMunicipalities([])
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

              <div className="grid md:grid-cols-2 gap-4">
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
                          field.onChange(value)
                          // Clear municipality when city is selected
                          form.setValue("municipality", "")
                          // Clear zip code so it can be set by the useEffect
                          form.setValue("zipCode", "")
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
                          field.onChange(value)
                          // Clear city when municipality is selected
                          form.setValue("city", "")
                          // Clear zip code so it can be set by the useEffect
                          form.setValue("zipCode", "")
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
                      <Input id="zipCode" placeholder="ZIP Code" className="bg-white/50" readOnly {...field} />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      ZIP code is automatically determined by city/municipality selection
                    </p>
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
                      <Input id="streetAddress" placeholder="Enter street address" className="bg-white/50" {...field} />
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
                <Button type="submit" className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditConfirmation} onOpenChange={setShowEditConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Address Edit</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">You are about to edit your address information. Please note:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 mb-4">
              <li>Changing your region will reset province, city, and municipality selections</li>
              <li>Changing your province will reset city and municipality selections</li>
              <li>You can select either a city OR a municipality, not both</li>
              <li>ZIP code will be automatically updated based on your selection</li>
            </ul>
            <p className="text-sm font-medium text-gray-700">Do you want to proceed with editing your address?</p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditConfirmation(false)}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowEditConfirmation(false)
                setIsEditing(true)
              }}
              className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]"
            >
              Edit Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

