"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect, useState } from "react"

// Firebase imports
// import { collection, getDocs } from "firebase/firestore"
// import { db } from "@/lib/firebase"

const formSchema = z.object({
  carBrand: z.string().min(1, "Car brand is required"),
  carModel: z.string().min(1, "Car model is required"),
  yearModel: z.string().min(1, "Year model is required"),
  transmission: z.string().min(1, "Transmission is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  odometer: z.string().min(1, "Odometer reading is required"),
  generalServices: z.array(z.string()).min(1, "At least one service must be selected"),
  specificIssues: z.string().max(1000, "Description must not exceed 1000 characters"),
})

// Sample data structure - to be replaced with Firebase data
const carData: Record<string, string[]> = {
  Toyota: ["Vios", "Corolla", "Camry", "Fortuner", "Innova"],
  Honda: ["Civic", "BRV", "CRV", "City", "Accord"],
  Ford: ["Raptor", "Everest", "Ranger", "Mustang", "Ecosport"],
}

const transmissionTypes = ["Automatic", "Manual"]
const fuelTypes = ["Gas", "Diesel"]
const odometerRanges = ["0km - 50,000km", "50,000km - 150,000km", "150,000km - 250,000km"]
const services = [
  { id: "PAINT JOBS", label: "Paint Jobs" },
  { id: "BRAKE SHOES CLEAN", label: "Brake Shoes Clean" },
  { id: "ENGINE OVERHAUL", label: "Engine Overhaul" },
  { id: "SUSPENSION SYSTEMS", label: "Suspension Systems" },
  { id: "BRAKE SHOES REPLACE", label: "Brake Shoes Replace" },
  { id: "BRAKE CLEAN", label: "Brake Clean" },
  { id: "ENGINE TUNING", label: "Engine Tuning" },
  { id: "AIR COONDITIONING", label: "Air Conditioning" },
  { id: "BRAKE REPLACE", label: "Brake Replace" },
  { id: "OIL CHANGE", label: "Oil Change" },
]

interface CarDetailsFormProps {
  initialData: any
  onSubmit: (data: any) => void
  onBack: () => void
}

export function CarDetailsForm({ initialData, onSubmit, onBack }: CarDetailsFormProps) {
  const [carBrands, setCarBrands] = useState<string[]>(Object.keys(carData))
  const [availableModels, setAvailableModels] = useState<string[]>([])
  // const [carBrands, setCarBrands] = useState<string[]>([])
  // const [availableModels, setAvailableModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carBrand: initialData.carBrand || "",
      carModel: initialData.carModel || "",
      yearModel: initialData.yearModel || "",
      transmission: initialData.transmission || "",
      fuelType: initialData.fuelType || "",
      odometer: initialData.odometer || "",
      generalServices: initialData.generalServices || [],
      specificIssues: initialData.specificIssues || "",
    },
  })

  const selectedBrand = form.watch("carBrand")
  const [characterCount, setCharacterCount] = React.useState(initialData.specificIssues?.length || 0)

  // Uncomment this to fetch actual data from Firebase
  /*
  useEffect(() => {
    async function fetchCarBrands() {
      setLoading(true)
      try {
        const brandsSnapshot = await getDocs(collection(db, "carBrands"))
        const brandsList = brandsSnapshot.docs.map(doc => doc.id)
        setCarBrands(brandsList)
      } catch (error) {
        console.error("Error fetching car brands:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCarBrands()
  }, [])
  */

  // Update available models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      // For the static data example
      setAvailableModels(carData[selectedBrand] || [])
      
      // Uncomment for Firebase implementation
      /*
      async function fetchCarModels() {
        setLoading(true)
        try {
          const modelsSnapshot = await getDocs(collection(db, "carBrands", selectedBrand, "models"))
          const modelsList = modelsSnapshot.docs.map(doc => doc.id)
          setAvailableModels(modelsList)
        } catch (error) {
          console.error("Error fetching car models:", error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchCarModels()
      */
      
      // Reset the car model field when brand changes
      form.setValue("carModel", "")
    }
  }, [selectedBrand, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="carBrand"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Car Brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      carBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carModel"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBrand}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Car Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : availableModels.length > 0 ? (
                      availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-models" disabled>
                        {selectedBrand ? "No models available" : "Select a brand first"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="yearModel"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Year Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 25 }, (_, i) => 2024 - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
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
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Transmission" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transmissionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Fuel Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {fuelTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
            name="odometer"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Odometer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {odometerRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
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
          name="generalServices"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <label className="text-sm font-medium">General Services</label>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <FormField
                    key={service.id}
                    control={form.control}
                    name="generalServices"
                    render={({ field }) => {
                      return (
                        <FormItem key={service.id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(service.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, service.id])
                                  : field.onChange(field.value?.filter((value: string) => value !== service.id))
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {service.label}
                            </label>
                          </div>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specificIssues"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="For specific issue/s, kindly describe in detail..."
                    className="min-h-[100px] bg-white/50 resize-none"
                    maxLength={1000}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      setCharacterCount(e.target.value.length)
                    }}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">{characterCount}/1000</div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="border-[#1e4e8c] text-[#1e4e8c]">
            Back
          </Button>
          <Button type="submit" className="bg-[#1e4e8c] text-white">
            Proceed
          </Button>
        </div>
      </form>
    </Form>
  )
}