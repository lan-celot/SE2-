"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/customer-components/ui/button"
import { Textarea } from "@/components/customer-components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/customer-components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/customer-components/ui/select"
import { Checkbox } from "@/components/customer-components/ui/checkbox"
import { useEffect, useState, useMemo } from "react"

// Import car database
import {
  getCarBrands,
  getModelsByBrand,
  getYearsByModel,
} from "@/components/customer-components/dashboard/book/carDatabase.js"

const formSchema = z.object({
  carBrand: z.string().min(1, "Car brand is required"),
  carModel: z.string().min(1, "Car model is required"),
  yearModel: z.string().min(1, "Year model is required"),
  plateNumber: z.string().min(1, "Plate number is required"),
  transmission: z.string().min(1, "Transmission is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  odometer: z.string().min(1, "Odometer reading is required"),
  services: z.array(z.string()).min(1, "At least one service must be selected"),
  specificIssues: z.string().max(1000, "Description must not exceed 1000 characters"),
  needHelp: z.boolean().optional(),
  helpDescription: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const transmissionTypes = ["Automatic", "Manual"]
const fuelTypes = ["Gas", "Diesel", "Electric"]
const odometerRanges = ["0km - 50,000km", "50,000km - 150,000km", "150,000km - 250,000km", "250,000km+"]

// Service categories with sub-services
const serviceCategories = [
  {
    id: "general",
    label: "General Auto Repair & Maintenance",
    services: [
      "Engine diagnostics, tuning, and repairs",
      "Oil change, fluid checks, and filter replacements",
      "Battery inspection and replacement",
      "Transmission service and repairs",
      "Fuel system and cooling system maintenance",
      "Oil Change with or w/o Filter",
      "Air Filter Replacement",
      "PMS (Preventive Maintenance Service)",
      "Engine Timing Repair",
    ],
  },
  {
    id: "brake",
    label: "Brake & Suspension Services",
    services: [
      "Brake inspection, cleaning, and replacement",
      "Suspension system repairs and upgrades",
      "Wheel alignment and balancing",
      "BrakeMaster Repair",
    ],
  },
  {
    id: "body",
    label: "Body & Exterior Services",
    services: [
      "Paint jobs, dent removal, and scratch repair",
      "Window, headlight, and taillight restoration",
      "Rust prevention and undercoating",
    ],
  },
  {
    id: "tires",
    label: "Tires & Wheels",
    services: ["Tire replacement", "Rim repair and refinishing"],
  },
  {
    id: "electrical",
    label: "Electrical & Diagnostic Services",
    services: [
      "Computerized engine diagnostics",
      "Alternator, starter, and battery checks",
      "Sensor calibration and replacement",
    ],
  },
  {
    id: "air",
    label: "Air Conditioning Services",
    services: [
      "Freon Recharging",
      "Compressor Repair",
      "Aircon Fan Repair",
      "Evaporator Replacement",
      "Aircon Full Service",
      "Compressor Assembly",
    ],
  },
  {
    id: "performance",
    label: "Performance & Customization",
    services: ["Exhaust system and suspension upgrades", "ECU tuning and performance modifications"],
  },
  {
    id: "emergency",
    label: "Emergency & Roadside Assistance",
    services: ["Towing services and roadside assistance", "Lockout, jumpstart, and flat tire services"],
  },
  {
    id: "insurance",
    label: "Insurance & Inspection Services",
    services: ["Vehicle inspection and repair estimates", "Emissions testing and compliance"],
  },
]

// Split service categories into two columns
const leftColumnCategories = serviceCategories.slice(0, Math.ceil(serviceCategories.length / 2))
const rightColumnCategories = serviceCategories.slice(Math.ceil(serviceCategories.length / 2))

interface CarDetailsFormProps {
  initialData?: Partial<FormData>
  onSubmit: (data: FormData) => void
  onBack: () => void
}

export function CarDetailsForm({ initialData = {}, onSubmit, onBack }: CarDetailsFormProps) {
  const [carBrands, setCarBrands] = useState<string[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      carBrand: initialData.carBrand || "",
      carModel: initialData.carModel || "",
      yearModel: initialData.yearModel || "",
      plateNumber: initialData.plateNumber || "",
      transmission: initialData.transmission || "",
      fuelType: initialData.fuelType || "",
      odometer: initialData.odometer || "",
      services: initialData.services || [],
      specificIssues: initialData.specificIssues || "",
      needHelp: initialData.needHelp || false,
      helpDescription: initialData.helpDescription || "",
    },
  })

  const selectedBrand = form.watch("carBrand")
  const selectedModel = form.watch("carModel")
  const specificIssues = form.watch("specificIssues")
  const selectedServices = form.watch("services")
  const needHelp = form.watch("needHelp")
  const characterCount = useMemo(() => specificIssues?.length || 0, [specificIssues])

  // Load car brands once on component mount
  useEffect(() => {
    setCarBrands(getCarBrands())
  }, [])

  // Get available models based on selected brand
  const availableModels = useMemo(() => (selectedBrand ? getModelsByBrand(selectedBrand) : []), [selectedBrand])

  // Get available years based on selected model
  const availableYears = useMemo(() => {
    if (!selectedBrand || !selectedModel) return []
    return [...getYearsByModel(selectedBrand, selectedModel)].sort((a, b) => b - a)
  }, [selectedBrand, selectedModel])

  // Reset dependent fields when parent fields change
  useEffect(() => {
    if (selectedBrand && !availableModels.includes(form.getValues("carModel"))) {
      form.setValue("carModel", "", { shouldValidate: false })
      form.setValue("yearModel", "", { shouldValidate: false })
    }
  }, [selectedBrand, availableModels, form])

  // Function to toggle expanded category
  const toggleCategory = (categoryId: string) => {
    if (!needHelp) {
      setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
    }
  }

  // Count selected services per category
  const getSelectedServiceCount = (categoryId: string) => {
    const category = serviceCategories.find((cat) => cat.id === categoryId)
    if (!category) return 0

    return category.services.filter((service) => selectedServices.includes(service)).length
  }

  // Get all selected categories
  const selectedCategories = useMemo(() => {
    return serviceCategories.filter((category) =>
      category.services.some((service) => selectedServices.includes(service)),
    )
  }, [selectedServices])

  // Total selected services count
  const totalSelectedServices = useMemo(() => selectedServices.length, [selectedServices])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Render a service category
  const renderServiceCategory = (category: (typeof serviceCategories)[0]) => (
    <div
      key={category.id}
      className={`border rounded-md overflow-hidden mb-3 ${needHelp ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div
        className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
        onClick={() => toggleCategory(category.id)}
      >
        <div className="flex items-center">
          <span className="font-medium text-blue-800">{category.label}</span>
          {getSelectedServiceCount(category.id) > 0 && (
            <span className="ml-2 bg-blue-800 text-white text-xs px-2 py-1 rounded-full">
              {getSelectedServiceCount(category.id)}
            </span>
          )}
        </div>
        <span
          className="transition-transform duration-200"
          style={{
            transform: expandedCategory === category.id ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ❯
        </span>
      </div>

      {expandedCategory === category.id && (
        <div className="p-3 bg-white border-t">
          <div className="space-y-2">
            {category.services.map((service) => (
              <FormField
                key={service}
                control={form.control}
                name="services"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={field.value?.includes(service)}
                      onCheckedChange={(checked) => {
                        const updatedValue = checked
                          ? [...field.value, service]
                          : field.value?.filter((value) => value !== service)
                        field.onChange(updatedValue)
                      }}
                      disabled={needHelp}
                    />
                    <label htmlFor={service} className="text-sm cursor-pointer">
                      {service}
                    </label>
                  </div>
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section Headers */}
        <div className="border-b pb-2 mb-4">
          <h2 className="text-lg font-medium text-blue-800">Vehicle Details</h2>
        </div>

        {/* Vehicle Details Section */}
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="carBrand"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Car Brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {carBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
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
              name="carModel"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBrand}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Car Model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableModels.length > 0 ? (
                        availableModels.map((model: string) => (
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedModel}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Year Model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableYears.length > 0 ? (
                        availableYears.map((year: number) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-years" disabled>
                          {selectedModel ? "No years available" : "Select a model first"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input
                      type="text"
                      placeholder="Plate Number"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="transmission"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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

            <FormField
              control={form.control}
              name="fuelType"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
                      <SelectTrigger>
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
        </div>

        {/* Need Help Checkbox */}
        <FormField
          control={form.control}
          name="needHelp"
          render={({ field }) => (
            <FormItem className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-start space-x-3">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <label className="font-medium">I'm not sure about my car details</label>
                  <p className="text-sm text-gray-500">
                    Check this if you need help identifying your car or describing your issue
                  </p>
                </div>
              </div>
            </FormItem>
          )}
        />

        {/* Help Description and File Upload */}
        {needHelp && (
          <div className="p-4 border rounded-md bg-white">
            <h3 className="font-medium mb-2">Tell us about your car</h3>
            <FormField
              control={form.control}
              name="helpDescription"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your car and issue as best as you can..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Upload a photo of your car or issue (optional)</p>
              <div className="flex items-center gap-2">
                <input type="file" id="car-photo" accept="image/*" className="hidden" onChange={handleFileChange} />
                <label
                  htmlFor="car-photo"
                  className="px-3 py-2 border border-blue-800 text-blue-800 rounded-md cursor-pointer text-sm hover:bg-blue-50"
                >
                  Choose File
                </label>
                <span className="text-sm text-gray-500">{selectedFile ? selectedFile.name : "No file chosen"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Services Section Header */}
        <div className="border-b pb-2 mb-4 mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-blue-800">Services</h2>
            <span
              className={`bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full ${
                totalSelectedServices === 0 ? "hidden" : ""
              }`}
            >
              {totalSelectedServices} selected
            </span>
          </div>
        </div>

        {/* Services Section - Two Columns */}
        <div className={`grid md:grid-cols-2 gap-4 ${needHelp ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Left Column */}
          <div>{leftColumnCategories.map(renderServiceCategory)}</div>

          {/* Right Column */}
          <div>{rightColumnCategories.map(renderServiceCategory)}</div>
        </div>

        {/* Selected Services Summary */}
        {selectedCategories.length > 0 && !needHelp && (
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="font-medium text-sm mb-2">Selected Services:</p>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white px-2 py-1 rounded-md text-xs border border-blue-200 flex items-center"
                >
                  {category.label}
                  <span className="ml-1 bg-blue-800 text-white px-1.5 rounded-full">
                    {getSelectedServiceCount(category.id)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <FormField control={form.control} name="services" render={() => <FormMessage />} />

        {/* Additional Info Section Header */}
        <div className="border-b pb-2 mb-4 mt-8">
          <h2 className="text-lg font-medium text-blue-800">Additional Information</h2>
        </div>

        {/* Specific Issues */}
        <FormField
          control={form.control}
          name="specificIssues"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormControl>
                <div className="relative">
                  <Textarea
                    placeholder="For specific issue/s, kindly describe in detail..."
                    className={`min-h-[100px] resize-none ${needHelp ? "opacity-50 pointer-events-none" : ""}`}
                    maxLength={1000}
                    disabled={needHelp}
                    {...field}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">{characterCount}/1000</div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Controls */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="border-blue-800 text-blue-800">
            Back
          </Button>
          <Button type="submit" className="bg-blue-800 text-white">
            Proceed
          </Button>
        </div>
      </form>
    </Form>
  )
}