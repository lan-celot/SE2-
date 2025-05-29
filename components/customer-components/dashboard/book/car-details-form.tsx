
"use client"
import { useForm } from "react-hook-form"
import type React from "react"

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
import { useEffect, useState, useMemo, useCallback, useRef } from "react"

// Import car database
import {
  getCarBrands,
  getModelsByBrand,
  getYearsByModel,
} from "@/components/customer-components/dashboard/book/carDatabase"

import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"

// Import the AddCarDialog component
import { AddCarDialog } from "@/components/customer-components/dashboard/book/addcardialog"

// Session storage keys
const SESSION_BRANDS_KEY = "session_car_brands"
const SESSION_MODELS_KEY = "session_car_models"
const SESSION_YEARS_KEY = "session_car_years"
const FORM_PROGRESS_KEY = "car_form_progress"

// Session storage helper functions
const getSessionData = (key: string) => {
  if (typeof window === "undefined") return []
  try {
    const data = sessionStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const setSessionData = (key: string, data: any) => {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save to session storage:", error)
  }
}

// Form persistence helper functions
const saveFormProgress = (data: any) => {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(FORM_PROGRESS_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save form progress:", error)
  }
}

const getFormProgress = () => {
  if (typeof window === "undefined") return null
  try {
    const data = sessionStorage.getItem(FORM_PROGRESS_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const clearFormProgress = () => {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(FORM_PROGRESS_KEY)
  } catch (error) {
    console.error("Failed to clear form progress:", error)
  }
}

// Enhanced car database functions that include session data
const getCarBrandsWithSession = () => {
  const originalBrands = getCarBrands()
  const sessionBrands = getSessionData(SESSION_BRANDS_KEY)
  return [...originalBrands, ...sessionBrands].sort()
}

const getModelsByBrandWithSession = (brand: string) => {
  const originalModels = getModelsByBrand(brand)
  const sessionModels = getSessionData(SESSION_MODELS_KEY)
  const brandSessionModels = sessionModels.filter((item: any) => item.brand === brand).map((item: any) => item.model)
  return [...originalModels, ...brandSessionModels].sort()
}

const getYearsByModelWithSession = (brand: string, model: string) => {
  const originalYears = getYearsByModel(brand, model)
  const sessionYears = getSessionData(SESSION_YEARS_KEY)
  const modelSessionYears = sessionYears
    .filter((item: any) => item.brand === brand && item.model === model)
    .map((item: any) => item.year)
  return [...originalYears, ...modelSessionYears].sort((a: number, b: number) => b - a)
}

// Function to add new car data to session
const addToSession = (type: "brand" | "model" | "year", data: any) => {
  switch (type) {
    case "brand":
      const sessionBrands = getSessionData(SESSION_BRANDS_KEY)
      if (!sessionBrands.includes(data.brandName)) {
        setSessionData(SESSION_BRANDS_KEY, [...sessionBrands, data.brandName])
      }
      break
    case "model":
      const sessionModels = getSessionData(SESSION_MODELS_KEY)
      const modelExists = sessionModels.some(
        (item: any) => item.brand === data.brandName && item.model === data.modelName,
      )
      if (!modelExists) {
        setSessionData(SESSION_MODELS_KEY, [...sessionModels, { brand: data.brandName, model: data.modelName }])
      }
      break
    case "year":
      const sessionYears = getSessionData(SESSION_YEARS_KEY)
      const yearExists = sessionYears.some(
        (item: any) => item.brand === data.brandName && item.model === data.modelName && item.year === data.yearStart,
      )
      if (!yearExists) {
        setSessionData(SESSION_YEARS_KEY, [
          ...sessionYears,
          { brand: data.brandName, model: data.modelName, year: data.yearStart },
        ])
      }
      break
  }
}

// Constants
const transmissionTypes = ["Automatic", "Manual", "CVT", "Semi-automatic", "Dual-clutch"]
const fuelTypes = ["Gas", "Diesel", "Electric", "Hybrid", "LPG"]

// Fixed odometer ranges
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

type FormData = z.infer<typeof formSchema> & {
  uploadedFiles?: Array<{
    fileName: string
    fileUrl: string
    fileSize: number
    fileType: string
  }>
}

// Animated completion indicator component
const CompletionIndicator = ({ isComplete }: { isComplete: boolean }) => (
  <span className={`flex items-center transition-all duration-300 ${isComplete ? "text-green-600" : "text-red-600"}`}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-5 w-5 mr-1 transition-transform duration-300 ${
        isComplete ? "scale-100 animate-[bounce_0.5s_ease-in-out]" : "scale-90"
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      {isComplete ? (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      ) : (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      )}
    </svg>
    {isComplete ? (
      <span className="animate-[fadeIn_0.5s_ease-in-out]">Complete</span>
    ) : (
      <span>Incomplete</span>
    )}
  </span>
)

export function CarDetailsForm({ initialData = {}, onSubmit, onBack }: CarDetailsFormProps) {
  const [carBrands, setCarBrands] = useState<string[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState<"details" | "services">("details")
  const [showErrors, setShowErrors] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

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

  // Move these state variables inside the component
  const [isUploading, setIsUploading] = useState(false)
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const { toast } = useToast()
  const [needHelp, setNeedHelp] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Enable real-time validation but don't show errors initially
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
    },
  })

  const selectedBrand = form.watch("carBrand")
  const selectedModel = form.watch("carModel")
  const specificIssues = form.watch("specificIssues")
  const selectedServices = form.watch("services") || []
  const plateNumber = form.watch("plateNumber")
  const transmission = form.watch("transmission")
  const fuelType = form.watch("fuelType")
  const odometer = form.watch("odometer")

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
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

  // Load car brands once on component mount (including session data)
  useEffect(() => {
    setCarBrands(getCarBrandsWithSession())
  }, [])

  // Check if details tab is complete (all fields filled AND valid) - optimized
  useEffect(() => {
    const errors = form.formState.errors
    const values = form.getValues()

    // Check if all required fields have valid values
    const hasAllRequiredFields = Boolean(
      values.carBrand?.trim() &&
      values.carModel?.trim() &&
      values.yearModel?.trim() &&
      values.plateNumber?.trim() &&
      values.transmission?.trim() &&
      values.fuelType?.trim() &&
      values.odometer?.trim()
    )

    // Check if there are no validation errors
    const hasNoValidationErrors = !Object.keys(errors).some(key => 
      ['carBrand', 'carModel', 'yearModel', 'plateNumber', 'transmission', 'fuelType', 'odometer'].includes(key)
    )

    // Only set complete if all fields are filled AND valid
    setDetailsTabComplete(hasAllRequiredFields && hasNoValidationErrors)
  }, [form.formState.errors, form.watch()])

  // Check if services tab is complete (at least one service selected AND valid) - optimized
  useEffect(() => {
    const hasAtLeastOneService = selectedServices && selectedServices.length > 0
    const hasNoServiceErrors = !form.formState.errors.services

    setServicesTabComplete(hasAtLeastOneService && hasNoServiceErrors)
  }, [selectedServices, form.formState.errors.services])

  // Get available models based on selected brand (including session data) - memoized
  const availableModels = useMemo(
    () => (selectedBrand ? getModelsByBrandWithSession(selectedBrand) : []),
    [selectedBrand],
  )

  // Get available years based on selected model (including session data) - memoized
  const availableYears = useMemo(() => {
    if (!selectedBrand || !selectedModel) return []
    return getYearsByModelWithSession(selectedBrand, selectedModel)
  }, [selectedBrand, selectedModel])

  // Filter lists with max 5 items visible at once (scrollable) - optimized
  const filteredBrands = useMemo(() => {
    if (!showBrandDropdown) return []
    if (brandSearchText.trim() === "") return carBrands
    return carBrands.filter((brand) => brand.toLowerCase().includes(brandSearchText.toLowerCase()))
  }, [carBrands, brandSearchText, showBrandDropdown])

  const filteredModels = useMemo(() => {
    if (!showModelDropdown) return []
    if (modelSearchText.trim() === "") return availableModels
    return availableModels.filter((model: string) => model.toLowerCase().includes(modelSearchText.toLowerCase()))
  }, [availableModels, modelSearchText, showModelDropdown])

  const filteredYears = useMemo(() => {
    if (!showYearDropdown) return []
    if (yearSearchText.trim() === "") return availableYears
    return availableYears.filter((year: number) => year.toString().includes(yearSearchText))
  }, [availableYears, yearSearchText, showYearDropdown])

  // Reset dependent fields when parent fields change
  useEffect(() => {
    if (selectedBrand) {
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
      const currentYear = form.getValues("yearModel")
      if (currentYear && !availableYears.includes(Number.parseInt(currentYear))) {
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
    setExpandedCategory((prevCategory) => (prevCategory === categoryId ? null : categoryId))
  }, [])

  // Count selected services per category - memoized
  const getSelectedServiceCount = useCallback(
    (categoryId: string) => {
      const category = serviceCategories.find((cat) => cat.id === categoryId)
      if (!category) return 0
      return category.services.filter((service) => selectedServices.includes(service)).length
    },
    [selectedServices],
  )

  // Get all selected categories - memoized
  const selectedCategories = useMemo(
    () =>
      serviceCategories.filter((category) => category.services.some((service) => selectedServices.includes(service))),
    [selectedServices],
  )

  // Total selected services count - memoized
  const totalSelectedServices = useMemo(() => selectedServices.length, [selectedServices])

  // Handle multiple file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const filesArray = Array.from(e.target.files)
        const errors: string[] = []
        const validFiles: File[] = []

        // Validation constraints
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        const maxSize = 5 * 1024 * 1024 // 5MB

        filesArray.forEach((file) => {
          // Validate file type
          if (!validTypes.includes(file.type)) {
            errors.push(`${file.name}: Please select a valid image file (JPEG, PNG, GIF, or WEBP)`)
            return
          }

          // Validate file size
          if (file.size > maxSize) {
            errors.push(`${file.name}: File size should be less than 5MB`)
            return
          }

          validFiles.push(file)
        })

        // Set errors if any
        if (errors.length > 0) {
          setFileErrors(errors)
          toast({
            title: "File Error",
            description: errors[0],
            variant: "destructive",
          })
        } else {
          setFileErrors([])
        }

        // Add valid files to state
        if (validFiles.length > 0) {
          setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles])
        }
      }
    },
    [toast],
  )

  // Upload files function
  const uploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return []

    setIsUploading(true)
    const uploadResults = []
    const errors = []

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL and Key must be provided")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `car_image_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `car-images/${fileName}`

        const { data, error } = await supabase.storage.from("car-uploads").upload(filePath, file, {
          upsert: true,
          cacheControl: "3600",
        })

        if (error) {
          errors.push(`Error uploading ${file.name}: ${error.message}`)
          continue
        }

        const publicUrlResult = supabase.storage.from("car-uploads").getPublicUrl(filePath)
        const publicUrl = publicUrlResult.data.publicUrl
        uploadResults.push({
          fileName: file.name,
          fileUrl: publicUrl,
          fileSize: file.size,
          fileType: file.type,
        })
      }

      if (errors.length > 0) {
        toast({
          title: "Some uploads failed",
          description: errors[0],
          variant: "destructive",
        })
      }

      return uploadResults
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload Error",
        description: `Failed to upload files: ${(error as Error).message || "Unknown error"}`,
        variant: "destructive",
      })
      return []
    } finally {
      setIsUploading(false)
    }
  }, [selectedFiles, toast])

  // Remove a file from selected files
  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }, [])

  // Handle brand selection
  const handleBrandSelect = useCallback(
    (brand: string) => {
      form.setValue("carBrand", brand, { shouldValidate: true })
      setBrandSearchText(brand)
      form.setValue("carModel", "", { shouldValidate: false })
      form.setValue("yearModel", "", { shouldValidate: false })
      setModelSearchText("")
      setYearSearchText("")
      setShowBrandDropdown(false)
    },
    [form],
  )

  // Handle model selection
  const handleModelSelect = useCallback(
    (model: string) => {
      form.setValue("carModel", model, { shouldValidate: true })
      setModelSearchText(model)
      form.setValue("yearModel", "", { shouldValidate: false })
      setYearSearchText("")
      setShowModelDropdown(false)
    },
    [form],
  )

  // Handle year selection
  const handleYearSelect = useCallback(
    (year: number) => {
      form.setValue("yearModel", year.toString(), { shouldValidate: true })
      setYearSearchText(year.toString())
      setShowYearDropdown(false)
    },
    [form],
  )

  // Toggle dropdowns with memoized callbacks
  const toggleBrandDropdown = useCallback(() => {
    setShowBrandDropdown((prevState) => !prevState)
    if (!showBrandDropdown) {
      setBrandSearchText("")
    }
  }, [showBrandDropdown])

  const toggleModelDropdown = useCallback(() => {
    if (!selectedBrand) return
    setShowModelDropdown((prevState) => !prevState)
    if (!showModelDropdown) {
      setModelSearchText("")
    }
  }, [selectedBrand, showModelDropdown])

  const toggleYearDropdown = useCallback(() => {
    if (!selectedModel) return
    setShowYearDropdown((prevState) => !prevState)
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

  // Handle success after adding new car data to session
  const handleAddCarSuccess = useCallback(
    (newCarData: any) => {
      // Add to session storage
      addToSession(addCarType, newCarData)

      // Show success message
      toast({
        title: "Success",
        description: `${addCarType === "brand" ? "Brand" : addCarType === "model" ? "Model" : "Year"} added for this session!`,
        variant: "default",
      })

      // Refresh the appropriate data and set form values
      if (addCarType === "brand") {
        // Refresh brands list and select the new brand
        setCarBrands(getCarBrandsWithSession())
        handleBrandSelect(newCarData.brandName)
        // If model was also provided, select it
        if (newCarData.modelName) {
          setTimeout(() => {
            handleModelSelect(newCarData.modelName)
            // If year was also provided, select it
            if (newCarData.yearStart) {
              setTimeout(() => {
                handleYearSelect(newCarData.yearStart)
              }, 100)
            }
          }, 100)
        }
      } else if (addCarType === "model") {
        // Select the new model
        handleModelSelect(newCarData.modelName)
        // If year was also provided, select it
        if (newCarData.yearStart) {
          setTimeout(() => {
            handleYearSelect(newCarData.yearStart)
          }, 100)
        }
      } else if (addCarType === "year") {
        // Select the new year
        handleYearSelect(newCarData.yearStart)
      }

      // Close the dialog
      setShowAddCarDialog(false)
    },
    [addCarType, handleBrandSelect, handleModelSelect, handleYearSelect, toast],
  )

  // Load saved form progress on component mount
  useEffect(() => {
    const savedProgress = getFormProgress()
    if (savedProgress && Object.keys(initialData).length === 0) {
      // Only load saved progress if no initial data is provided
      form.reset(savedProgress.formData)

      // Restore search text states and sync with form values
      if (savedProgress.formData.carBrand) {
        setBrandSearchText(savedProgress.formData.carBrand)
        form.setValue("carBrand", savedProgress.formData.carBrand)
      }
      if (savedProgress.formData.carModel) {
        setModelSearchText(savedProgress.formData.carModel)
        form.setValue("carModel", savedProgress.formData.carModel)
      }
      if (savedProgress.formData.yearModel) {
        setYearSearchText(savedProgress.formData.yearModel)
        form.setValue("yearModel", savedProgress.formData.yearModel)
      }

      setActiveTab(savedProgress.activeTab || "details")
      setExpandedCategory(savedProgress.expandedCategory || null)
    }
  }, [form, initialData])

  // Save form progress whenever form data changes - debounced for performance
  useEffect(() => {
    const subscription = form.watch((data) => {
      const progressData = {
        formData: {
          ...data,
          // Ensure search text values are included in form data
          carBrand: brandSearchText || data.carBrand,
          carModel: modelSearchText || data.carModel,
          yearModel: yearSearchText || data.yearModel,
        },
        brandSearchText,
        modelSearchText,
        yearSearchText,
        activeTab,
        expandedCategory,
      }
      saveFormProgress(progressData)
    })
    return () => subscription.unsubscribe()
  }, [form, brandSearchText, modelSearchText, yearSearchText, activeTab, expandedCategory])

  // Custom form submission handler
  const handleSubmit = useCallback(
    async (data: FormData) => {
      setShowValidation(true)
      setShowErrors(true)

      // Check if we're in the details tab and fields are incomplete
      if (activeTab === "details" && !detailsTabComplete) {
        toast({
          title: "Incomplete Details",
          description: "Please fill in all vehicle details correctly before proceeding.",
          variant: "destructive",
        })
        return
      }

      // Check if we're in the services tab and no services are selected
      if (activeTab === "services" && !servicesTabComplete) {
        toast({
          title: "Services Required",
          description: "Please select at least one service before proceeding.",
          variant: "destructive",
        })
        return
      }

      let fileUploadResults: { fileName: string; fileUrl: string; fileSize: number; fileType: string }[] = []

      if (selectedFiles.length > 0) {
        fileUploadResults = await uploadFiles()
      }

      // If in details tab and all is valid, switch to services tab
      if (activeTab === "details" && detailsTabComplete) {
        setActiveTab("services")
        return
      }

      // Only proceed with final submission if all validations pass
      if (detailsTabComplete && servicesTabComplete) {
        // Clear form progress on successful submission
        clearFormProgress()

        onSubmit({
          ...data,
          uploadedFiles: fileUploadResults,
        })
      }
    },
    [form, onSubmit, selectedFiles, uploadFiles, activeTab, detailsTabComplete, servicesTabComplete, toast],
  )

  // Update the Proceed button text based on the current tab
  const getProceedButtonText = useCallback(() => {
    if (activeTab === "details") {
      return detailsTabComplete ? "Next: Select Services" : "Please Complete Details"
    }
    return "Proceed"
  }, [activeTab, detailsTabComplete])

  const handleBack = useCallback(() => {
    // Save current progress before going back
    const currentData = form.getValues()
    const progressData = {
      formData: {
        ...currentData,
        // Ensure search text values are saved
        carBrand: brandSearchText || currentData.carBrand,
        carModel: modelSearchText || currentData.carModel,
        yearModel: yearSearchText || currentData.yearModel,
      },
      brandSearchText,
      modelSearchText,
      yearSearchText,
      activeTab,
      expandedCategory,
    }
    saveFormProgress(progressData)
    onBack()
  }, [form, brandSearchText, modelSearchText, yearSearchText, activeTab, expandedCategory, onBack])

  const handlePlateNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 8)

    // Show error immediately if invalid characters are typed
    if (value && !/^[A-Z0-9]*$/.test(value)) {
      setShowErrors(true)
    }

    return value
  }, [])

  // Render a service category - memoized component
  const renderServiceCategory = useCallback(
    (category: (typeof serviceCategories)[0]) => (
      <div key={category.id} className="border rounded-md overflow-hidden mb-3">
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
                            : currentValue.filter((value) => value !== service)
                          field.onChange(updatedValue)
                        }}
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
    ),
    [expandedCategory, getSelectedServiceCount, toggleCategory, form],
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex border-b">
          <div
            className={`w-1/2 py-2 text-center cursor-pointer border-r transition-all duration-200 ${
              activeTab === "details"
                ? detailsTabComplete
                  ? "bg-green-50 font-medium text-green-800"
                  : showValidation
                    ? "bg-red-50 font-medium text-red-800"
                    : "bg-blue-50 font-medium text-blue-800"
                : "bg-white hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("details")}
          >
            <span className="flex items-center justify-center gap-2">
              Vehicle Details 
              {showValidation && (
                detailsTabComplete ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-600 animate-[bounce_0.5s_ease-in-out]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-red-600 animate-[bounce_0.5s_ease-in-out]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )
              )}
            </span>
          </div>
          <div
            className={`w-1/2 py-2 text-center cursor-pointer transition-all duration-200 ${
              activeTab === "services"
                ? servicesTabComplete
                  ? "bg-green-50 font-medium text-green-800"
                  : showValidation
                    ? "bg-red-50 font-medium text-red-800"
                    : "bg-blue-50 font-medium text-blue-800"
                : "bg-white hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("services")}
          >
            <span className="flex items-center justify-center gap-2">
              Services
              {showValidation && (
                servicesTabComplete ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-600 animate-[bounce_0.5s_ease-in-out]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-red-600 animate-[bounce_0.5s_ease-in-out]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )
              )}
            </span>
          </div>
        </div>

        {/* Vehicle Details Tab Content */}
        {activeTab === "details" && (
          <>
            {/* Vehicle Details Section */}
            <div className="border-b pb-2 mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-blue-800">Vehicle Details</h2>
                {showValidation && <CompletionIndicator isComplete={detailsTabComplete} />}
              </div>
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
                          className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background transition-colors duration-200 focus:border-blue-500"
                          value={brandSearchText}
                          onChange={handleBrandSearchChange}
                          onFocus={() => setShowBrandDropdown(true)}
                        />
                        <div
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          onClick={toggleBrandDropdown}
                        >
                          {showBrandDropdown ? "▲" : "▼"}
                        </div>
                        {showBrandDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredBrands.length > 0 ? (
                              filteredBrands.map((brand) => (
                                <div
                                  key={brand}
                                  className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center transition-colors duration-150"
                                  onClick={() => handleBrandSelect(brand)}
                                >
                                  <span>{brand}</span>
                                  {selectedBrand === brand && <span className="text-blue-800">✓</span>}
                                </div>
                              ))
                            ) : (
                              <div className="p-3 space-y-2">
                                <div className="text-gray-500">Car brand not found</div>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="text-blue-800 border border-blue-800 bg-white hover:bg-blue-50 transition-colors duration-200"
                                  onClick={() => handleAddNew("brand")}
                                >
                                  Add New Brand
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <FormMessage
                        className={
                          showErrors || (form.formState.touchedFields.carBrand && form.formState.errors.carBrand)
                            ? "text-red-500 text-xs mt-1"
                            : "hidden"
                        }
                      />
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
                          className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background transition-colors duration-200 focus:border-blue-500 disabled:bg-gray-100"
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
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          onClick={toggleModelDropdown}
                        >
                          {showModelDropdown ? "▲" : "▼"}
                        </div>
                        {showModelDropdown && selectedBrand && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredModels.length > 0 ? (
                              filteredModels.map((model: string) => (
                                <div
                                  key={model}
                                  className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center transition-colors duration-150"
                                  onClick={() => handleModelSelect(model)}
                                >
                                  <span>{model}</span>
                                  {selectedModel === model && <span className="text-blue-800">✓</span>}
                                </div>
                              ))
                            ) : (
                              <div className="p-3 space-y-2">
                                <div className="text-gray-500">Car model not found</div>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="text-blue-800 border border-blue-800 bg-white hover:bg-blue-50 transition-colors duration-200"
                                  onClick={() => handleAddNew("model")}
                                >
                                  Add New Model
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <FormMessage
                        className={
                          showErrors || (form.formState.touchedFields.carModel && form.formState.errors.carModel)
                            ? "text-red-500 text-xs mt-1"
                            : "hidden"
                        }
                      />
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
                          className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background transition-colors duration-200 focus:border-blue-500 disabled:bg-gray-100"
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
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          onClick={toggleYearDropdown}
                        >
                          {showYearDropdown ? "▲" : "▼"}
                        </div>
                        {showYearDropdown && selectedModel && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredYears.length > 0 ? (
                              filteredYears.map((year: number) => (
                                <div
                                  key={year}
                                  className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center transition-colors duration-150"
                                  onClick={() => handleYearSelect(year)}
                                >
                                  <span>{year}</span>
                                  {form.getValues("yearModel") === year.toString() && (
                                    <span className="text-blue-800">✓</span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="p-3 space-y-2">
                                <div className="text-gray-500">Year model not found</div>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="text-blue-800 border border-blue-800 bg-white hover:bg-blue-50 transition-colors duration-200"
                                  onClick={() => handleAddNew("year")}
                                >
                                  Add New Year
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <FormMessage
                        className={
                          showErrors || (form.formState.touchedFields.yearModel && form.formState.errors.yearModel)
                            ? "text-red-500 text-xs mt-1"
                            : "hidden"
                        }
                      />
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
                          className={`w-full h-10 px-3 rounded-md border bg-background transition-colors duration-200 focus:border-blue-500 ${
                            showErrors ||
                            (form.formState.touchedFields.plateNumber && form.formState.errors.plateNumber)
                              ? "border-red-500 focus:border-red-500"
                              : "border-input"
                          }`}
                          {...field}
                          onChange={(e) => {
                            const value = handlePlateNumberChange(e)
                            field.onChange(value)
                          }}
                        />
                      </FormControl>
                      <FormMessage
                        className={
                          showErrors || (form.formState.touchedFields.plateNumber && form.formState.errors.plateNumber)
                            ? "text-red-500 text-xs mt-1"
                            : "hidden"
                        }
                      />
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
                          <SelectTrigger className="h-10 text-base transition-colors duration-200 focus:border-blue-500">
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
                      <FormMessage
                        className={
                          showErrors ||
                          (form.formState.touchedFields.transmission && form.formState.errors.transmission)
                            ? "text-red-500 text-xs mt-1"
                            : "hidden"
                        }
                      />
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
                          <SelectTrigger className="h-10 text-base transition-colors duration-200 focus:border-blue-500">
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
                      <FormMessage
                        className={
                          showErrors || (form.formState.touchedFields.fuelType && form.formState.errors.fuelType)
                            ? "text-red-500 text-xs mt-1"
                            : "hidden"
                        }
                      />
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
                          <SelectTrigger className="h-10 text-base transition-colors duration-200 focus:border-blue-500">
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
                      <FormMessage
                        className={
                          showErrors || (form.formState.touchedFields.odometer && form.formState.errors.odometer)
                            ? "text-red-500 text-xs mt-1"
                            : "hidden"
                        }
                      />
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
                        className="min-h-[100px] resize-none transition-colors duration-200 focus:border-blue-500"
                        maxLength={1000}
                        {...field}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">{characterCount}/1000</div>
                    </div>
                  </FormControl>
                  <FormMessage
                    className={
                      showErrors ||
                      (form.formState.touchedFields.specificIssues && form.formState.errors.specificIssues)
                        ? "text-red-500 text-xs mt-1"
                        : "hidden"
                    }
                  />
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
                {showValidation && <CompletionIndicator isComplete={servicesTabComplete} />}
              </div>
            </div>

            {/* Services Section - Two Columns */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div>{leftColumnCategories.map(renderServiceCategory)}</div>

              {/* Right Column */}
              <div>{rightColumnCategories.map(renderServiceCategory)}</div>
            </div>

            {/* Selected Services Summary */}
            {selectedCategories.length > 0 && (
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

            {/* Services Error Message */}
            {showErrors && form.formState.errors.services && (
              <div className="text-red-500 text-sm mt-2">{form.formState.errors.services.message}</div>
            )}
          </>
        )}

        {/* Form Controls */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="border-blue-800 text-blue-800 hover:bg-blue-50 transition-colors duration-200"
          >
            Back
          </Button>
          <Button 
            type="submit" 
            className={`${
              (activeTab === "details" && !detailsTabComplete) || 
              (activeTab === "services" && !servicesTabComplete)
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-800 hover:bg-blue-900"
            } text-white transition-colors duration-200`}
            disabled={(activeTab === "details" && !detailsTabComplete) || 
                     (activeTab === "services" && !servicesTabComplete)}
          >
            {getProceedButtonText()}
          </Button>
        </div>

        {/* Add Car Dialog */}
        {showAddCarDialog && (
          <AddCarDialog
            open={showAddCarDialog}
            onOpenChange={setShowAddCarDialog}
            type={addCarType}
            brandName={addCarType === "model" || addCarType === "year" ? selectedBrand : undefined}
            modelName={addCarType === "year" ? selectedModel : undefined}
            onSuccess={handleAddCarSuccess}
          />
        )}
      </form>
    </Form>
  )
}

// Define the form schema outside the component
const formSchema = z.object({
  carBrand: z.string().min(1, "Car brand is required"),
  carModel: z.string().min(1, "Car model is required"),
  yearModel: z.string().min(1, "Year model is required"),
  plateNumber: z
    .string()
    .min(1, "Plate number is required")
    .max(8, "Plate number must not exceed 8 characters")
    .refine(
      (value) => {
        const cleanValue = value.replace(/\s/g, "").toUpperCase()
        const patterns = [/^[A-Z]{3}\d{3,4}$/, /^[A-Z]{2}\d{4,5}$/, /^[A-Z]{1}\d{4,5}$/, /^[A-Z]{3}\d{3}[A-Z]{1}$/]
        return patterns.some((pattern) => pattern.test(cleanValue))
      },
      {
        message: "Valid formats: ABC123, AB1234, A1234, or ABC123A"
      },
    )
    .refine(
      (value) => {
        const cleanValue = value.replace(/\s/g, "").toUpperCase()
        if (!/^[A-Z0-9]+$/.test(cleanValue)) {
          return false
        }
        if (cleanValue.length < 4) {
          return false
        }
        return true
      },
      {
        message: "Use only letters and numbers (min. 4 characters)"
      },
    ),
  transmission: z.string().min(1, "Transmission is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  odometer: z.string().min(1, "Odometer reading is required"),
  services: z.array(z.string()).refine((services) => services.length > 0, {
    message: "At least one service must be selected",
    path: ["services"],
  }),
  specificIssues: z.string().max(1000, "Description must not exceed 1000 characters"),
})


