"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/customer-components/ui/button"
import { Input } from "@/components/customer-components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/customer-components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/customer-components/ui/select"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import useLocalStorage from "@/hooks/useLocalStorage"

// Type definitions
type City = string | null
type Municipality = string | null
type Province = string
type Region = string

interface LocationData {
  provinces: Province[]
  locations: {
    [province: string]: {
      cities: City[]
      municipalities: Municipality[]
    }
  }
}

interface LocationHierarchy {
  [region: string]: LocationData
}

// Import from your addresshierachybank.js
// For now using the existing data, but you should import from the second file
const philippineRegions = ["Region I (Ilocos Region)"].sort()

// Hierarchical location data
const locationHierarchy: LocationHierarchy = {
  "Region I (Ilocos Region)": {
    provinces: ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
    locations: {
      "Ilocos Norte": {
        cities: ["Laoag", "Batac"],
        municipalities: ["Paoay", "Pagudpud"]
      },
      "Ilocos Sur": {
        cities: ["Vigan", "Candon"],
        municipalities: ["Bantay", "Narvacan"]
      },
      "La Union": {
        cities: ["San Fernando"],
        municipalities: ["Agoo", "Bauang"]
      },
      "Pangasinan": {
        cities: ["Dagupan", "Alaminos", "San Carlos", "Urdaneta"],
        municipalities: ["Lingayen", "Bayambang", "Binmaley", "Mangaldan", "Rosales"]
      }
    }
  }
}

// Define type for zip code mapping structure
interface ZipCodeCity {
  [city: string]: string;
}

interface ZipCodeMunicipality {
  [municipality: string]: string;
}

interface ZipCodeProvince {
  default: string;
  cities: ZipCodeCity;
  municipalities: ZipCodeMunicipality;
}

interface ZipCodeRegion {
  default: string;
  provinces: {
    [province: string]: ZipCodeProvince;
  };
}

interface ZipCodeMapping {
  [region: string]: ZipCodeRegion;
}

// ZIP code mapping
const zipCodeMapping: ZipCodeMapping = {
  "Region I (Ilocos Region)": {
    default: "2900",
    provinces: {
      "Ilocos Norte": {
        default: "2900",
        cities: { "Laoag": "2900", "Batac": "2906" },
        municipalities: { "Paoay": "2910", "Pagudpud": "2919" }
      },
      "Ilocos Sur": {
        default: "2700",
        cities: { "Vigan": "2700", "Candon": "2710" },
        municipalities: { "Bantay": "2727", "Narvacan": "2704" }
      },
      "La Union": {
        default: "2500",
        cities: { "San Fernando": "2500" },
        municipalities: { "Agoo": "2504", "Bauang": "2501" }
      },
      "Pangasinan": {
        default: "2400",
        cities: { "Dagupan": "2400", "Alaminos": "2404", "San Carlos": "2420", "Urdaneta": "2428" },
        municipalities: { "Lingayen": "2401", "Bayambang": "2423", "Binmaley": "2417", "Mangaldan": "2432", "Rosales": "2441" }
      }
    }
  }
}

// Define FormData interface with proper types
interface FormData {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  region: string;
  province: string;
  city: string | null;
  municipality: string | null;
  streetAddress: string;
  zipCode: string;
}

// Default form data
const defaultFormData: FormData = {
  firstName: "", lastName: "", gender: "", email: "", phoneNumber: "", dateOfBirth: "",
  region: "", province: "", city: null, municipality: null, streetAddress: "", zipCode: ""
}

// Form schema with validation - Fixed types to allow nullable values
const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    gender: z.string().min(1, "Gender is required"),
    email: z.string().email("Email is required").min(1, "Invalid email address"),
    phoneNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in format: 09XXXXXXXXX"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    region: z.string().min(1, "Region is required"),
    province: z.string().min(1, "Province is required"),
    city: z.string().nullable(),
    municipality: z.string().nullable(),
    streetAddress: z.string().min(1, "Street address is required"),
    zipCode: z.string().min(1, "Assign a City or Municipality"),
  })
  .refine((data) => {
    const selectedProvince = data.province;
    if (selectedProvince && data.region && locationHierarchy[data.region]?.locations[selectedProvince]) {
      const hasCities = locationHierarchy[data.region].locations[selectedProvince].cities.length > 0;
      const hasMunicipalities = locationHierarchy[data.region].locations[selectedProvince].municipalities.length > 0;
      if (hasCities && hasMunicipalities) {
        return !!data.city || !!data.municipality;
      }
    }
    return true;
  }, { message: "Either a city or municipality must be selected", path: ["city"] });

interface PersonalDetailsFormProps {
  initialData: any;
  onSubmit: (data: any) => void;
}

export function PersonalDetailsForm({ initialData, onSubmit }: PersonalDetailsFormProps) {
  const auth = getAuth();
  const user = auth.currentUser;
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);

  // Merge initial data with defaults
  const mergedInitialData = initialData ? { ...defaultFormData, ...initialData } : defaultFormData;
  const [formData, setFormData] = useLocalStorage<FormData>("personalDetailsForm", mergedInitialData);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
    mode: "onChange"
  });

  // Watch form values
  const currentRegion = form.watch("region");
  const currentProvince = form.watch("province");
  const currentCity = form.watch("city");
  const currentMunicipality = form.watch("municipality");

  // Define fields that should be read-only (from Firebase)
  const readOnlyFields = useMemo(() => ['firstName', 'lastName', 'email', 'dateOfBirth', 'gender'], []);

  // Helper function to safely get zip code
  const getZipCode = useCallback((region: string, province: string, city?: string | null, municipality?: string | null): string => {
    const regionData = zipCodeMapping[region];
    if (!regionData) return "";

    const provinceData = regionData.provinces[province];
    if (!provinceData) return regionData.default || "";

    if (city && provinceData.cities[city]) {
      return provinceData.cities[city];
    }

    if (municipality && provinceData.municipalities[municipality]) {
      return provinceData.municipalities[municipality];
    }

    return provinceData.default || regionData.default || "";
  }, []);

  // Update provinces when region changes
  const updateProvinces = useCallback((region: string) => {
    if (region && region in locationHierarchy) {
      setAvailableProvinces([...locationHierarchy[region].provinces].sort());
    } else {
      setAvailableProvinces([]);
    }
  }, []);

  // Update cities and municipalities when province changes
  const updateLocations = useCallback((region: string, province: string) => {
    if (region && province && region in locationHierarchy && province in locationHierarchy[region].locations) {
      const locations = locationHierarchy[region].locations[province];
      setAvailableCities([...locations.cities].sort());
      setAvailableMunicipalities([...locations.municipalities].sort());
    } else {
      setAvailableCities([]);
      setAvailableMunicipalities([]);
    }
  }, []);

  // Initialize provinces when region is set
  useEffect(() => {
    if (currentRegion) updateProvinces(currentRegion);
  }, [currentRegion, updateProvinces]);

  // Reset dependent fields when region changes
  useEffect(() => {
    if (currentRegion && formDataLoaded && formData.region !== currentRegion) {
      form.setValue("province", "");
      form.setValue("city", null);
      form.setValue("municipality", null);
      form.setValue("zipCode", "");
      setAvailableCities([]);
      setAvailableMunicipalities([]);
    }
  }, [currentRegion, form, formData?.region, formDataLoaded]);

  // Update locations when province changes
  useEffect(() => {
    if (currentRegion && currentProvince) {
      updateLocations(currentRegion, currentProvince);
      
      if (formDataLoaded && formData?.province !== currentProvince) {
        form.setValue("city", null);
        form.setValue("municipality", null);
        form.setValue("zipCode", "");
      }
    }
  }, [currentRegion, currentProvince, updateLocations, form, formData?.province, formDataLoaded]);

  // Handle city selection
  useEffect(() => {
    if (!formDataLoaded) return;
    
    if (currentRegion && currentProvince && currentCity) {
      if (form.getValues("municipality")) form.setValue("municipality", null);
      
      const zipCode = getZipCode(currentRegion, currentProvince, currentCity);
      if (zipCode) form.setValue("zipCode", zipCode);
    }
  }, [currentCity, currentProvince, currentRegion, form, formDataLoaded, getZipCode]);

  // Handle municipality selection
  useEffect(() => {
    if (!formDataLoaded) return;
    
    if (currentRegion && currentProvince && currentMunicipality) {
      if (form.getValues("city")) form.setValue("city", null);
      
      const zipCode = getZipCode(currentRegion, currentProvince, undefined, currentMunicipality);
      if (zipCode) form.setValue("zipCode", zipCode);
    }
  }, [currentMunicipality, currentProvince, currentRegion, form, formDataLoaded, getZipCode]);

  // Clear ZIP code if neither city nor municipality is selected
  useEffect(() => {
    if (formDataLoaded && currentRegion && currentProvince && !currentCity && !currentMunicipality) {
      form.setValue("zipCode", "");
    }
  }, [currentCity, currentMunicipality, currentProvince, currentRegion, form, formDataLoaded]);

  // Save form data to localStorage with debounce
  useEffect(() => {
    if (!formDataLoaded) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const subscription = form.watch((formValues) => {
      if (formValues) {
        // Clear previous timeout
        if (timeoutId) clearTimeout(timeoutId);
        
        // Set new timeout for debounce
        timeoutId = setTimeout(() => setFormData(formValues as FormData), 300);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [form, formDataLoaded, setFormData]);

  // Fetch user data on component mount
  useEffect(() => {
    if (user && !formDataLoaded) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "accounts", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfileData(userData);
            
            // Use stored form data or initialize from user data
            if (!localStorage.getItem("personalDetailsForm")) {
              const formData = {
                ...defaultFormData,
                ...Object.fromEntries(
                  Object.entries(userData)
                    .filter(([key]) => key in defaultFormData)
                    .map(([key, value]) => [key, value || ""])
                )
              };
              
              // Ensure city and municipality are properly handled
              if (!formData.city) formData.city = null;
              if (!formData.municipality) formData.municipality = null;
              
              form.reset(formData);
              setFormData(formData);
            }
            
            // Initialize location dropdowns
            if (userData.region && userData.region in locationHierarchy) {
              setAvailableProvinces([...locationHierarchy[userData.region].provinces].sort());
              
              if (userData.province && userData.province in locationHierarchy[userData.region].locations) {
                const locations = locationHierarchy[userData.region].locations[userData.province];
                setAvailableCities([...locations.cities].sort());
                setAvailableMunicipalities([...locations.municipalities].sort());
              }
            }
          }
          
          setFormDataLoaded(true);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setFormDataLoaded(true);
        }
      };

      fetchUserData();
    } else if (!formDataLoaded) {
      setFormDataLoaded(true);
    }
  }, [user, form, setFormData, formDataLoaded]);

  // Form submission handler - memoized for performance
  const handleSubmit = useCallback((data: z.infer<typeof formSchema>) => {
    setFormData(data as FormData);
    onSubmit(data);
  }, [onSubmit, setFormData]);

  // Reset form handler - only clear non-read-only fields
  const handleReset = useCallback(() => {
    const currentValues = form.getValues();
    const resetValues = { ...defaultFormData };
    
    // Preserve read-only fields (from Firebase)
    readOnlyFields.forEach(field => {
      resetValues[field as keyof typeof defaultFormData] = currentValues[field as keyof typeof currentValues] as string;
    });
    
    form.reset(resetValues);
    setFormData(resetValues);
    setAvailableCities([]);
    setAvailableMunicipalities([]);
  }, [form, setFormData, readOnlyFields]);

  // Prepare field props factory for optimization
  const getFieldProps = useCallback((fieldName: string) => {
    const isReadOnly = readOnlyFields.includes(fieldName);
    return {
      disabled: isReadOnly,
      className: `bg-white/50 ${isReadOnly ? 'cursor-pointer hover:bg-white/60' : ''}`,
      title: isReadOnly ? "This field is auto-filled from your profile" : ""
    };
  }, [readOnlyFields]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Row 1: First Name and Last Name */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="First Name" {...field} {...getFieldProps("firstName")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Last Name" {...field} {...getFieldProps("lastName")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 2: Gender and Birthdate */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  disabled={readOnlyFields.includes("gender")}
                >
                  <FormControl>
                    <SelectTrigger className={`bg-white/50 ${readOnlyFields.includes("gender") ? 'cursor-pointer hover:bg-white/60' : ''}`} title={readOnlyFields.includes("gender") ? "This field is auto-filled from your profile" : ""}>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    type="date" 
                    placeholder="Date of Birth" 
                    {...field} 
                    {...getFieldProps("dateOfBirth")} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 3: Email and Phone Number */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    {...field} 
                    {...getFieldProps("email")} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    placeholder="Phone Number (09XXXXXXXXX)" 
                    {...field}
                    onChange={(e) => {
                      // Ensure the input always starts with "09"
                      let value = e.target.value;
                      if (!value.startsWith("09") && value.length > 0) {
                        value = "09" + value.replace(/^0+9*/, "");
                      }
                      // Limit to 11 digits
                      value = value.slice(0, 11);
                      // Only allow digits
                      value = value.replace(/[^\d]/g, "");
                      field.onChange(value);
                    }}
                    className="bg-white/50"
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500">Philippine Phone Number</p>
              </FormItem>
            )}
          />
        </div>

        {/* Row 4: Region, Province, and ZIP Code */}
        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {philippineRegions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                <p className="text-xs text-gray-500">My Current Geographical Area</p>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value} disabled={!availableProvinces.length}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Province" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {availableProvinces.map(province => (
                      <SelectItem key={province} value={province}>{province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="ZIP Code" className="bg-white/50" {...field} disabled={true} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row 5: City and Municipality */}
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <Select 
                  onValueChange={(value) => field.onChange(value || null)} 
                  value={field.value || ""} 
                  disabled={!availableCities.length || !currentProvince}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {availableCities.map(city => (
                      <SelectItem key={city || ""} value={city || ""}>{city}</SelectItem>
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
                <Select 
                  onValueChange={(value) => field.onChange(value || null)} 
                  value={field.value || ""} 
                  disabled={!availableMunicipalities.length || !currentProvince}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Select Municipality" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {availableMunicipalities.map(municipality => (
                      <SelectItem key={municipality || ""} value={municipality || ""}>{municipality}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
                <p className="text-xs text-gray-500">Select a city or municipality</p>
              </FormItem>
            )}
          />
        </div>

        {/* Row 6: Street Address */}
        <FormField
          control={form.control}
          name="streetAddress"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="House No. & Street, Subdivision/Barangay" className="bg-white/50" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500">Enter your complete street address, building name/number, unit/apartment number, etc.</p>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" onClick={handleReset} className="bg-gray-300 text-black">
            Clear
          </Button>
          <Button type="submit" className="bg-[#1e4e8c] text-white">
            Proceed
          </Button>
        </div>
      </form>
    </Form>
  )
}