"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/customer-components/ui/button"
import { Textarea } from "@/components/customer-components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/customer-components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customer-components/ui/select"
import { Checkbox } from "@/components/customer-components/ui/checkbox"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"

// Import car database
import { getCarBrands, getModelsByBrand, getYearsByModel } from "@/components/customer-components/dashboard/book/carDatabase"
import { AddCarDialog } from "@/components/customer-components/dashboard/book/addcardialog"

const formSchema = z.object({
  carBrand: z.string().min(1, "Car brand is required"),
  carModel: z.string().min(1, "Car model is required"),
  yearModel: z.string().min(1, "Year model is required"),
  plateNumber: z.string()
    .min(1, "Plate number is required")
    .max(8, "Plate number must not exceed 8 characters") // Set a maximum length of 8 characters
    .regex(/^([A-Za-z]{3}\d{3,4}|[A-Za-z]{2}\d{4,5}|[A-Za-z]{1}\d{4,5}|[A-Za-z]{3}\d{3}[A-Za-z]{1})$/,
      "Enter a valid Philippine plate number (e.g., ABC1234, AB1234, A1234, ABC123A)"),
  transmission: z.string().min(1, "Transmission is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  odometer: z.string().min(1, "Odometer reading is required"),
  services: z.array(z.string()).refine(services => services.length > 0, {
    message: "At least one service must be selected",
    path: ["services"]
  }).optional().or(z.array(z.string())),
  specificIssues: z.string().max(1000, "Description must not exceed 1000 characters"),
  needHelp: z.boolean().optional(),
  helpDescription: z.string().optional().refine(() => true),
});


// Constants
const transmissionTypes = ["Automatic", "Manual", "CVT", "Semi-automatic", "Dual-clutch"]
const fuelTypes = ["Gas", "Diesel", "Electric", "Hybrid", "LPG"]
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

// Split service categories into two columns (computed once outside component)
const leftColumnCategories = serviceCategories.slice(0, Math.ceil(serviceCategories.length / 2))
const rightColumnCategories = serviceCategories.slice(Math.ceil(serviceCategories.length / 2))

interface CarDetailsFormProps {
  initialData?: Partial<FormData>
  onSubmit: (data: FormData) => void
  onBack: () => void
}

type FormData = z.infer<typeof formSchema>

export function CarDetailsForm({ initialData = {}, onSubmit, onBack }: CarDetailsFormProps) {
  const [carBrands, setCarBrands] = useState<string[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState<"details" | "services">("details")
  
  // Tab completion tracking
  const [detailsTabComplete, setDetailsTabComplete] = useState(false)
  const [servicesTabComplete, setServicesTabComplete] = useState(false)
  
  // States for searchable dropdowns
  const [brandSearchText, setBrandSearchText] = useState("")
  const [modelSearchText, setModelSearchText] = useState("")
  const [yearSearchText, setYearSearchText] = useState("")
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)

  // Refs for detecting clicks outside
  const brandDropdownRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const yearDropdownRef = useRef<HTMLDivElement>(null)

  // State for showing add car dialog
  const [showAddCarDialog, setShowAddCarDialog] = useState(false)
  const [addCarType, setAddCarType] = useState<"brand" | "model" | "year">("brand")

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
  const selectedServices = form.watch("services") || []
  const needHelp = form.watch("needHelp")
  const helpDescription = form.watch("helpDescription")
  const plateNumber = form.watch("plateNumber")
  const transmission = form.watch("transmission")
  const fuelType = form.watch("fuelType")
  const odometer = form.watch("odometer")

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Handle brand dropdown
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false)
      }
      // Handle model dropdown
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
      // Handle year dropdown
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Memoized values
  const characterCount = useMemo(() => specificIssues?.length || 0, [specificIssues])

  // Load car brands once on component mount
  useEffect(() => {
    setCarBrands(getCarBrands())
  }, [])

  // Check if details tab is complete
  useEffect(() => {
    setDetailsTabComplete(
      Boolean(
        selectedBrand && 
        selectedModel && 
        form.getValues("yearModel") && 
        plateNumber && 
        transmission && 
        fuelType && 
        odometer
      )
    )
  }, [selectedBrand, selectedModel, form, plateNumber, transmission, fuelType, odometer])

  // Check if services tab is complete
  useEffect(() => {
    setServicesTabComplete(
      needHelp 
        ? Boolean(helpDescription && helpDescription.trim() !== '')
        : selectedServices.length > 0
    )
  }, [needHelp, helpDescription, selectedServices])

  // Get available models based on selected brand
  const availableModels = useMemo(() => 
    selectedBrand ? getModelsByBrand(selectedBrand) : []
  , [selectedBrand])

  // Get available years based on selected model
  const availableYears = useMemo(() => {
    if (!selectedBrand || !selectedModel) return []
    return [...getYearsByModel(selectedBrand, selectedModel)].sort((a, b) => b - a)
  }, [selectedBrand, selectedModel])

  // Filter lists with max 5 items visible at once (scrollable)
  const filteredBrands = useMemo(() => {
    if (showBrandDropdown) {
      if (brandSearchText.trim() === '') {
        return carBrands // Show all brands but only 5 visible at once (rest are scrollable)
      }
      return carBrands
        .filter(brand => brand.toLowerCase().includes(brandSearchText.toLowerCase()))
    }
    return []
  }, [carBrands, brandSearchText, showBrandDropdown])

  const filteredModels = useMemo(() => {
    if (showModelDropdown) {
      if (modelSearchText.trim() === '') {
        return availableModels // Show all models but only 5 visible at once (rest are scrollable)
      }
      return availableModels
        .filter((model: string) => model.toLowerCase().includes(modelSearchText.toLowerCase()))
    }
    return []
  }, [availableModels, modelSearchText, showModelDropdown])

  const filteredYears = useMemo(() => {
    if (showYearDropdown) {
      if (yearSearchText.trim() === '') {
        return availableYears // Show all years but only 5 visible at once (rest are scrollable)
      }
      return availableYears
        .filter((year: number) => year.toString().includes(yearSearchText))
    }
    return []
  }, [availableYears, yearSearchText, showYearDropdown])

  // Reset dependent fields when parent fields change
  useEffect(() => {
    if (selectedBrand) {
      // Reset car model and year model when brand changes
      if (!availableModels.includes(form.getValues("carModel"))) {
        form.setValue("carModel", "", { shouldValidate: false })
        form.setValue("yearModel", "", { shouldValidate: false })
        setModelSearchText("")
        setYearSearchText("")
      }
    }
  }, [selectedBrand, availableModels, form])

  // Reset year model when car model changes
  useEffect(() => {
    if (selectedModel) {
      // Reset year model when model changes
      const currentYear = form.getValues("yearModel")
      if (currentYear && !availableYears.includes(parseInt(currentYear))) {
        form.setValue("yearModel", "", { shouldValidate: false })
        setYearSearchText("")
      }
    }
  }, [selectedModel, availableYears, form])

  // Update validation schema based on needHelp
  useEffect(() => {
    if (needHelp) {
      form.clearErrors("services")
    }
  }, [needHelp, form])

  // Function to toggle expanded category
  const toggleCategory = useCallback((categoryId: string) => {
    if (!needHelp) {
      setExpandedCategory(prevCategory => prevCategory === categoryId ? null : categoryId)
    }
  }, [needHelp])

  // Count selected services per category - memoized
  const getSelectedServiceCount = useCallback((categoryId: string) => {
    const category = serviceCategories.find((cat) => cat.id === categoryId)
    if (!category) return 0
    return category.services.filter((service) => selectedServices.includes(service)).length
  }, [selectedServices])

  // Get all selected categories
  const selectedCategories = useMemo(() => 
    serviceCategories.filter((category) =>
      category.services.some((service) => selectedServices.includes(service))
    )
  , [selectedServices])

  // Total selected services count
  const totalSelectedServices = useMemo(() => 
    selectedServices.length
  , [selectedServices])

  // Handle multiple file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles(prevFiles => [...prevFiles, ...filesArray])
    }
  }, [])

  // Remove a file from selected files
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }, [])

  // Handle brand selection
  const handleBrandSelect = useCallback((brand: string) => {
    form.setValue("carBrand", brand, { shouldValidate: true })
    setBrandSearchText(brand)
    // Reset car model and year model when brand changes
    form.setValue("carModel", "", { shouldValidate: false })
    form.setValue("yearModel", "", { shouldValidate: false })
    setModelSearchText("")
    setYearSearchText("")
    setShowBrandDropdown(false)
  }, [form])

  // Handle model selection
  const handleModelSelect = useCallback((model: string) => {
    form.setValue("carModel", model, { shouldValidate: true })
    setModelSearchText(model)
    // Reset year model when model changes
    form.setValue("yearModel", "", { shouldValidate: false })
    setYearSearchText("")
    setShowModelDropdown(false)
  }, [form])

  // Handle year selection
  const handleYearSelect = useCallback((year: number) => {
    form.setValue("yearModel", year.toString(), { shouldValidate: true })
    setYearSearchText(year.toString())
    setShowYearDropdown(false)
  }, [form])

  // Toggle dropdowns with memoized callbacks
  const toggleBrandDropdown = useCallback(() => {
    setShowBrandDropdown(prevState => !prevState)
    if (!showBrandDropdown) {
      setBrandSearchText("")
    }
  }, [showBrandDropdown])

  const toggleModelDropdown = useCallback(() => {
    if (!selectedBrand) return
    setShowModelDropdown(prevState => !prevState)
    if (!showModelDropdown) {
      setModelSearchText("")
    }
  }, [selectedBrand, showModelDropdown])

  const toggleYearDropdown = useCallback(() => {
    if (!selectedModel) return
    setShowYearDropdown(prevState => !prevState)
    if (!showYearDropdown) {
      setYearSearchText("")
    }
  }, [selectedBrand, selectedModel, showYearDropdown])

  // Handle brand search input changes
  const handleBrandSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBrandSearchText(e.target.value)
    setShowBrandDropdown(true)
  }, [])

  // Handle model search input changes
  const handleModelSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setModelSearchText(e.target.value)
    setShowModelDropdown(true)
  }, [])

  // Handle year search input changes
  const handleYearSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setYearSearchText(e.target.value)
    setShowYearDropdown(true)
  }, [])

  // Handle "Add new" button click
  const handleAddNew = useCallback((type: "brand" | "model" | "year") => {
    setAddCarType(type)
    setShowAddCarDialog(true)
  }, [])

  // Handle success after adding new car data
  const handleAddCarSuccess = useCallback(() => {
    // Since we can't directly update the car database, we'll just notify the user
    // In a real implementation, we would refresh the data from the database
    
    // Close the dialog
    setShowAddCarDialog(false)
    
    // Show a message or take appropriate action
    alert("Car data added successfully! Please refresh to see updated data.")
    
  }, [addCarType, selectedBrand, selectedModel])

  // Custom form submission handler
  const handleSubmit = useCallback((data: FormData) => {
    // If needHelp is checked, we don't require services
    if (needHelp) {
      // Make sure helpDescription is filled
      if (!data.helpDescription || data.helpDescription.trim() === '') {
        form.setError('helpDescription', {
          type: 'manual',
          message: 'Please describe your car issue'
        })
        return
      }
      onSubmit(data)
    } else {
      // Otherwise check if services are selected
      if (!data.services || data.services.length === 0) {
        form.setError('services', {
          type: 'manual',
          message: 'At least one service must be selected'
        })
        return
      }
      onSubmit(data)
    }
  }, [form, needHelp, onSubmit])

  // Render a service category - memoized component
  const renderServiceCategory = useCallback((category: (typeof serviceCategories)[0]) => (
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
                      checked={(field.value || []).includes(service)}
                      onCheckedChange={(checked: any) => {
                        const currentValue = field.value || []
                        const updatedValue = checked
                          ? [...currentValue, service]
                          : currentValue.filter(value => value !== service)
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
  ), [expandedCategory, getSelectedServiceCount, needHelp, toggleCategory, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex border-b">
          <div 
            className={`w-1/2 py-2 text-center cursor-pointer border-r ${
              activeTab === "details" 
                ? detailsTabComplete 
                  ? "bg-blue-100 font-medium text-blue-800" 
                  : "bg-blue-50 font-medium text-blue-800"
                : "bg-white"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Vehicle Details {detailsTabComplete && "✓"}
          </div>
          <div 
            className={`w-1/2 py-2 text-center cursor-pointer ${
              activeTab === "services" 
                ? servicesTabComplete 
                  ? "bg-blue-100 font-medium text-blue-800" 
                  : "bg-blue-50 font-medium text-blue-800"
                : "bg-white"
            }`}
            onClick={() => setActiveTab("services")}
          >
            Services {servicesTabComplete && "✓"}
          </div>
        </div>

        {/* Vehicle Details Tab Content */}
        {activeTab === "details" && (
          <>
            {/* Vehicle Details Section */}
            <div className="border-b pb-2 mb-4">
              <h2 className="text-lg font-medium text-blue-800">Vehicle Details</h2>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Searchable Car Brand */}
                <FormField
                  control={form.control}
                  name="carBrand"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative" ref={brandDropdownRef}>
                        <input
                          type="text"
                          placeholder="Car Brand"
                          className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background"
                          value={brandSearchText}
                          onChange={handleBrandSearchChange}
                          onFocus={() => setShowBrandDropdown(true)}
                        />
                        <div 
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-500"
                          onClick={toggleBrandDropdown}
                        >
                          {showBrandDropdown ? "▲" : "▼"}
                        </div>
                        {showBrandDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredBrands.length > 0 
                              ? filteredBrands.map((brand) => (
                                  <div
                                    key={brand}
                                    className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                                    onClick={() => handleBrandSelect(brand)}
                                  >
                                    <span>{brand}</span>
                                    {selectedBrand === brand && <span className="text-blue-800">✓</span>}
                                  </div>
                                ))
                              : (
                                <div className="p-3 space-y-2">
                                  <div className="text-gray-500">Car brand not found</div>
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    className="text-blue-800 border border-blue-800 bg-white hover:bg-blue-50"
                                    onClick={() => handleAddNew("brand")}
                                  >
                                    Add New Brand
                                  </Button>
                                </div>
                              )
                            }
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Searchable Car Model */}
                <FormField
                  control={form.control}
                  name="carModel"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative" ref={modelDropdownRef}>
                        <input
                          type="text"
                          placeholder="Car Model"
                          className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background"
                          value={modelSearchText}
                          onChange={handleModelSearchChange}
                          onFocus={() => {
                            if (selectedBrand) {
                              setShowModelDropdown(true)
                            }
                          }}
                          disabled={!selectedBrand}
                        />
                        <div 
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-500"
                          onClick={toggleModelDropdown}
                        >
                          {showModelDropdown ? "▲" : "▼"}
                        </div>
                        {showModelDropdown && selectedBrand && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredModels.length > 0 
                              ? filteredModels.map((model: string) => (
                                  <div
                                    key={model}
                                    className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                                    onClick={() => handleModelSelect(model)}
                                  >
                                    <span>{model}</span>
                                    {selectedModel === model && <span className="text-blue-800">✓</span>}
                                  </div>
                                ))
                              : (
                                <div className="p-3 space-y-2">
                                  <div className="text-gray-500">Car model not found</div>
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    className="text-blue-800 border border-blue-800 bg-white hover:bg-blue-50"
                                    onClick={() => handleAddNew("model")}
                                  >
                                    Add New Model
                                  </Button>
                                </div>
                              )
                            }
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Searchable Year Model */}
                <FormField
                  control={form.control}
                  name="yearModel"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative" ref={yearDropdownRef}>
                        <input
                          type="text"
                          placeholder="Year Model"
                          className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background"
                          value={yearSearchText}
                          onChange={handleYearSearchChange}
                          onFocus={() => {
                            if (selectedModel) {
                              setShowYearDropdown(true)
                            }
                          }}
                          disabled={!selectedModel}
                        />
                        <div 
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-500"
                          onClick={toggleYearDropdown}
                        >
                          {showYearDropdown ? "▲" : "▼"}
                        </div>
                        {showYearDropdown && selectedModel && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredYears.length > 0 
                              ? filteredYears.map((year: number) => (
                                  <div
                                    key={year}
                                    className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                                    onClick={() => handleYearSelect(year)}
                                  >
                                    <span>{year}</span>
                                    {form.getValues("yearModel") === year.toString() && <span className="text-blue-800">✓</span>}
                                  </div>
                                ))
                              : (
                                <div className="p-3 space-y-2">
                                  <div className="text-gray-500">Year model not found</div>
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    className="text-blue-800 border border-blue-800 bg-white hover:bg-blue-50"
                                    onClick={() => handleAddNew("year")}
                                  >
                                    Add New Year
                                  </Button>
                                </div>
                              )
                            }
                          </div>
                        )}
                      </div>
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
                          placeholder="Plate Number (e.g., ABC1234)"
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
                    <FormItem className="h-10">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-base">
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
                    <FormItem className="h-10">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-base">
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
                    <FormItem className="h-10">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-base">
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

            {/* Additional Information Section */}
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
                        className="min-h-[100px] resize-none"
                        maxLength={1000}
                        {...field}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">{characterCount}/1000</div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Services Tab Content */}
        {activeTab === "services" && (
          <>
            {/* Services Section */}
            <div className="border-b pb-2 mb-4">
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
  
              {/* "I'm Not Sure" Option */}
              <FormField
                control={form.control}
                name="needHelp"
                render={({ field }) => (
                  <FormItem className="bg-blue-50 p-4 rounded-md mt-6">
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
                <div className="p-4 border rounded-md bg-white mt-4">
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
                    <p className="text-sm text-gray-600">Upload photos of your car or issue (optional)</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        id="car-photo" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                        multiple 
                      />
                      <label
                        htmlFor="car-photo"
                        className="px-3 py-2 border border-blue-800 text-blue-800 rounded-md cursor-pointer text-sm hover:bg-blue-50"
                      >
                        Choose Files
                      </label>
                      <span className="text-sm text-gray-500">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "No files chosen"}
                      </span>
                    </div>
                    
                    {/* Display selected files */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Selected Files:</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                              <div className="flex items-center space-x-2 overflow-hidden">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-800">
                                  📷
                                </div>
                                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

  
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