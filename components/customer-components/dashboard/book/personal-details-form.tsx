"use client"

import { useEffect, useState, useCallback } from "react"
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
type City = string
type Municipality = string
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


// Philippine region data
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


// Default form data
const defaultFormData = {
  firstName: "", lastName: "", gender: "", email: "", phoneNumber: "", dateOfBirth: "",
  region: "", province: "", city: "", municipality: "", streetAddress: "", zipCode: ""
}


// Form schema with validation
const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    gender: z.string().min(1, "Gender is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    phoneNumber: z.string()
      .regex(/^09\d{9}$/, "Phone number required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    region: z.string().min(1, "Region is required"),
    province: z.string().min(1, "Province is required"),
    city: z.string().optional(),
    municipality: z.string().optional(),
    streetAddress: z.string().min(1, "Street address is required"),
    zipCode: z.string().min(1, "Choose a city or municipality"),
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

// Type for form field names
type FormFieldName = keyof z.infer<typeof formSchema>;


export function PersonalDetailsForm({ initialData, onSubmit }: PersonalDetailsFormProps) {
  const auth = getAuth();
  const user = auth.currentUser;
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  const [shouldSaveFormData, setShouldSaveFormData] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  
  // Store permanent fields
  const [permanentFields, setPermanentFields] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    dateOfBirth: ""
  });

  // Merge initial data with defaults and store in localStorage
  const mergedInitialData = initialData ? { ...defaultFormData, ...initialData } : defaultFormData;
  const [formData, setFormData] = useLocalStorage("personalDetailsForm", mergedInitialData);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
    mode: "onChange"
  });

  // Set hydrated state once component mounts on client
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Watch form values
  const currentRegion = form.watch("region");
  const currentProvince = form.watch("province");
  const currentCity = form.watch("city");
  const currentMunicipality = form.watch("municipality");

  // Helper function to safely get zip code
  const getZipCode = useCallback((region: string, province: string, city?: string, municipality?: string): string => {
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

  // Save form data to localStorage whenever needed
  const saveFormData = useCallback((formValues: any) => {
    if (formValues && formDataLoaded && shouldSaveFormData) {
      setFormData({
        ...formValues,
        // Ensure permanent fields are always preserved
        firstName: permanentFields.firstName,
        lastName: permanentFields.lastName,
        gender: permanentFields.gender,
        email: permanentFields.email,
        dateOfBirth: permanentFields.dateOfBirth
      });
      // Reset the flag
      setShouldSaveFormData(false);
    }
  }, [formDataLoaded, permanentFields, setFormData, shouldSaveFormData]);

  // Handle location hierarchy changes
  useEffect(() => {
    // Initialize provinces when region is set
    if (currentRegion) {
      updateProvinces(currentRegion);
      
      // Reset dependent fields when region changes
      if (formDataLoaded && formData.region !== currentRegion) {
        form.setValue("province", "");
        form.setValue("city", "");
        form.setValue("municipality", "");
        form.setValue("zipCode", "");
        setAvailableCities([]);
        setAvailableMunicipalities([]);
        setShouldSaveFormData(true);
      }
    }
  }, [currentRegion, form, formData.region, formDataLoaded, updateProvinces]);

  // Update locations based on province
  useEffect(() => {
    if (currentRegion && currentProvince) {
      updateLocations(currentRegion, currentProvince);
      
      if (formDataLoaded && formData.province !== currentProvince) {
        form.setValue("city", "");
        form.setValue("municipality", "");
        form.setValue("zipCode", "");
        setShouldSaveFormData(true);
      }
    }
  }, [currentRegion, currentProvince, updateLocations, form, formData.province, formDataLoaded]);

  // Handle city/municipality selection and update ZIP code
  useEffect(() => {
    if (!formDataLoaded) return;
    
    if (currentRegion && currentProvince) {
      let shouldUpdate = false;
      
      if (currentCity) {
        // Clear municipality if city is selected
        if (form.getValues("municipality")) {
          form.setValue("municipality", "");
          shouldUpdate = true;
        }
        
        // Update ZIP code based on city
        const zipCode = getZipCode(currentRegion, currentProvince, currentCity);
        if (zipCode && form.getValues("zipCode") !== zipCode) {
          form.setValue("zipCode", zipCode);
          shouldUpdate = true;
        }
      } else if (currentMunicipality) {
        // Clear city if municipality is selected
        if (form.getValues("city")) {
          form.setValue("city", "");
          shouldUpdate = true;
        }
        
        // Update ZIP code based on municipality
        const zipCode = getZipCode(currentRegion, currentProvince, undefined, currentMunicipality);
        if (zipCode && form.getValues("zipCode") !== zipCode) {
          form.setValue("zipCode", zipCode);
          shouldUpdate = true;
        }
      } else {
        // Clear ZIP code if neither city nor municipality is selected
        if (form.getValues("zipCode")) {
          form.setValue("zipCode", "");
          shouldUpdate = true;
        }
      }
      
      // Only trigger save if needed
      if (shouldUpdate) {
        setShouldSaveFormData(true);
      }
    }
  }, [currentCity, currentMunicipality, currentProvince, currentRegion, form, formDataLoaded, getZipCode]);

  // Actually save form data when the flag is set
  useEffect(() => {
    if (shouldSaveFormData) {
      saveFormData(form.getValues());
    }
  }, [shouldSaveFormData, saveFormData, form]);

  // Improved tab focus handler - load data from localStorage
  useEffect(() => {
    const handleTabVisibilityChange = () => {
      if (!document.hidden && formDataLoaded) {
        const storedData = localStorage.getItem("personalDetailsForm");
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            // Only update fields that should be preserved across tab switches
            const currentValues = form.getValues();
            
            // Update form fields with data but don't trigger effects
            form.setValue("phoneNumber", parsedData.phoneNumber || currentValues.phoneNumber, { shouldValidate: false });
            form.setValue("region", parsedData.region || currentValues.region, { shouldValidate: false });
            form.setValue("province", parsedData.province || currentValues.province, { shouldValidate: false });
            form.setValue("city", parsedData.city || currentValues.city, { shouldValidate: false });
            form.setValue("municipality", parsedData.municipality || currentValues.municipality, { shouldValidate: false });
            form.setValue("streetAddress", parsedData.streetAddress || currentValues.streetAddress, { shouldValidate: false });
            form.setValue("zipCode", parsedData.zipCode || currentValues.zipCode, { shouldValidate: false });
            
            // Update location dropdowns based on the loaded data
            if (parsedData.region) {
              updateProvinces(parsedData.region);
              if (parsedData.region && parsedData.province) {
                updateLocations(parsedData.region, parsedData.province);
              }
            }
          } catch (error) {
            console.error("Error parsing stored form data:", error);
          }
        }
      }
    };

    // Listen for both focus events and visibility changes
    window.addEventListener('focus', handleTabVisibilityChange);
    document.addEventListener('visibilitychange', handleTabVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleTabVisibilityChange);
      document.removeEventListener('visibilitychange', handleTabVisibilityChange);
    };
  }, [form, updateLocations, updateProvinces, formDataLoaded]);

  // Fetch user data on component mount
  useEffect(() => {
    if (user && !formDataLoaded) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "accounts", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Store permanent fields
            const permanentData = {
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              gender: userData.gender || "",
              email: userData.email || "",
              dateOfBirth: userData.dateOfBirth || ""
            };
            setPermanentFields(permanentData);
            
            // Use stored form data or initialize from user data
            const storedFormData = localStorage.getItem("personalDetailsForm");
            
            if (!storedFormData) {
              // Create new form data from user data
              const formData = {
                ...defaultFormData,
                ...Object.fromEntries(
                  Object.entries(userData)
                    .filter(([key]) => key in defaultFormData)
                    .map(([key, value]) => [key, value || ""])
                )
              };
              
              form.reset(formData);
              setFormData(formData);
            } else {
              // If form data exists in localStorage, update it with permanent fields
              try {
                const parsedData = JSON.parse(storedFormData);
                form.reset({
                  ...parsedData,
                  firstName: permanentData.firstName,
                  lastName: permanentData.lastName,
                  gender: permanentData.gender,
                  email: permanentData.email,
                  dateOfBirth: permanentData.dateOfBirth
                });
              } catch (error) {
                console.error("Error parsing stored form data:", error);
              }
            }
            
            // Initialize location dropdowns
            if (userData.region && userData.region in locationHierarchy) {
              updateProvinces(userData.region);
              
              if (userData.province && userData.province in locationHierarchy[userData.region].locations) {
                updateLocations(userData.region, userData.province);
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
  }, [user, form, setFormData, formDataLoaded, updateLocations, updateProvinces]);

  // Form submission handler
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Ensure permanent fields aren't modified
    const submissionData = {
      ...data,
      firstName: permanentFields.firstName,
      lastName: permanentFields.lastName,
      gender: permanentFields.gender,
      email: permanentFields.email,
      dateOfBirth: permanentFields.dateOfBirth
    };
    
    setFormData(submissionData);
    onSubmit(submissionData);
  };

  // Reset form handler - only reset editable address fields
  const handleReset = () => {
    // Reset editable fields to empty values
    form.setValue("phoneNumber", "");
    form.setValue("region", "");
    form.setValue("province", "");
    form.setValue("city", "");
    form.setValue("municipality", "");
    form.setValue("streetAddress", "");
    form.setValue("zipCode", "");
    
    // Reset available locations
    setAvailableProvinces([]);
    setAvailableCities([]);
    setAvailableMunicipalities([]);
    
    // Update localStorage with reset form data - do this once
    setFormData({
      ...form.getValues(),
      phoneNumber: "",
      region: "",
      province: "",
      city: "",
      municipality: "",
      streetAddress: "",
      zipCode: ""
    });
  };

  // Modified function with proper type
  const handleFormFieldChange = (fieldName: FormFieldName, value: string) => {
    form.setValue(fieldName, value);
    setShouldSaveFormData(true);
  };

  // If not hydrated yet, return null or a simple loading state to prevent hydration mismatch
  if (!hydrated) {
    return <div className="min-h-[300px] flex items-center justify-center">Loading form...</div>;
  }

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
                  <Input 
                    placeholder="First Name" 
                    className="bg-white transition-colors focus:!ring-2 focus:!ring-blue-300" 
                    {...field} 
                    disabled={true}
                    value={permanentFields.firstName}  
                  />
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
                  <Input 
                    placeholder="Last Name" 
                    className="bg-white transition-colors focus:!ring-2 focus:!ring-blue-300" 
                    {...field} 
                    disabled={true} 
                    value={permanentFields.lastName}
                  />
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
                <FormControl>
                  <Input 
                    placeholder="Gender" 
                    className="bg-white transition-colors focus:!ring-2 focus:!ring-blue-300" 
                    {...field} 
                    disabled={true}
                    value={permanentFields.gender === "MALE" ? "Male" : permanentFields.gender === "FEMALE" ? "Female" : permanentFields.gender} 
                  />
                </FormControl>
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
                    className="bg-white transition-colors focus:!ring-2 focus:!ring-blue-300" 
                    {...field} 
                    disabled={true}
                    value={permanentFields.dateOfBirth} 
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
                    className="bg-white transition-colors focus:!ring-2 focus:!ring-blue-300" 
                    {...field} 
                    disabled={true}
                    value={permanentFields.email} 
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
                    className="bg-white/50 transition-colors hover:bg-white/60 focus:!ring-2 focus:!ring-blue-300" 
                    {...field} 
                    maxLength={11}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits
                      const digits = value.replace(/\D/g, '');
                      // Ensure it starts with 09 if there are at least 2 digits
                      if (digits.length >= 2 && !digits.startsWith('09')) {
                        field.onChange('09' + digits.substring(2));
                      } else {
                        field.onChange(digits);
                      }
                      
                      // Mark for saving later
                      setShouldSaveFormData(true);
                    }}
                  />
                </FormControl>
                <p className="text-xs text-gray-500 mt-1">Philippine Phone Number</p>
                <FormMessage />
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
                <Select 
                  onValueChange={(value) => {
                    handleFormFieldChange("region", value);
                  }} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/50 transition-colors hover:bg-white/60 focus:!ring-2 focus:!ring-blue-300">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {philippineRegions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">My Current Geographical Area</p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <Select 
                  onValueChange={(value) => {
                    handleFormFieldChange("province", value);
                  }} 
                  value={field.value} 
                  disabled={!availableProvinces.length}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/50 transition-colors hover:bg-white/60 focus:!ring-2 focus:!ring-blue-300">
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
                  <Input 
                    placeholder="ZIP Code" 
                    className="bg-white/50 transition-colors hover:bg-white/60 focus:!ring-2 focus:!ring-blue-300" 
                    {...field} 
                    disabled={true} 
                  />
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
                  onValueChange={(value) => {
                    handleFormFieldChange("city", value);
                  }}
                  value={field.value}
                  disabled={!availableCities.length || !currentProvince}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/50 transition-colors hover:bg-white/60 focus:!ring-2 focus:!ring-blue-300">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {availableCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Select a city or municipality</p>
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
                  onValueChange={(value) => {
                    handleFormFieldChange("municipality", value);
                  }}
                  value={field.value}
                  disabled={!availableMunicipalities.length || !currentProvince}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/50 transition-colors hover:bg-white/60 focus:!ring-2 focus:!ring-blue-300">
                      <SelectValue placeholder="Select Municipality" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56 overflow-y-auto">
                    {availableMunicipalities.map(municipality => (
                      <SelectItem key={municipality} value={municipality}>{municipality}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
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
                <Input 
                  placeholder="House No. & Street, Subdivision/Barangay" 
                  className="bg-white/50 transition-colors hover:bg-white/60 focus:!ring-2 focus:!ring-blue-300" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    // Mark for saving later
                    setShouldSaveFormData(true);
                  }}
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">Enter your complete street address, building name/number, unit/apartment number, etc.</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            onClick={handleReset} 
            className="bg-gray-300 text-black hover:bg-gray-400 transition-colors"
          >
            Clear
          </Button>
          <Button 
            type="submit" 
            className="bg-[#1e4e8c] text-white hover:bg-[#173c6b] transition-colors"
          >
            Proceed
          </Button>
        </div>
      </form>
    </Form>
  )
}