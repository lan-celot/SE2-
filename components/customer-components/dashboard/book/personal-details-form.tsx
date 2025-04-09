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
// Import from addresshierachybank.js
import { philippineRegions, locationHierarchy, zipCodeMapping } from "@/components/customer-components/dashboard/book/addresshierachybank"


// Type definitions
type City = string | null
type Municipality = string | null
type Province = string
type Region = string


// Define types for location hierarchy
type LocationData = {
  cities: string[];
  municipalities: string[];
}


type ProvinceLocations = {
  [province: string]: LocationData;
}


type RegionData = {
  provinces: string[];
  locations: ProvinceLocations;
}


// Define types for zip code mapping
type CityMunicipalityZipCodes = {
  [location: string]: string;
}


type ProvinceZipCodes = {
  default: string;
  cities: CityMunicipalityZipCodes;
  municipalities: CityMunicipalityZipCodes;
}


type RegionZipCodes = {
  default: string;
  provinces: {
    [province: string]: ProvinceZipCodes;
  };
}


// Create type-safe interfaces for our locationHierarchy and zipCodeMapping data
interface LocationHierarchyType {
  [region: string]: RegionData;
}


interface ZipCodeMappingType {
  [region: string]: RegionZipCodes;
}


// Type assertions to make TypeScript happy
const typedLocationHierarchy = locationHierarchy as LocationHierarchyType;
const typedZipCodeMapping = zipCodeMapping as ZipCodeMappingType;


// Default form data
const defaultFormData = {
  firstName: "", lastName: "", gender: "", email: "", phoneNumber: "", dateOfBirth: "",
  region: "", province: "", city: null as City, municipality: null as Municipality, streetAddress: "", zipCode: ""
}


// Form schema with validation
const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    gender: z.string().min(1, "Gender is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
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
    if (selectedProvince && data.region &&
        typedLocationHierarchy[data.region]?.locations[selectedProvince]) {
      const provinceData = typedLocationHierarchy[data.region].locations[selectedProvince];
      const hasCities = provinceData.cities.length > 0;
      const hasMunicipalities = provinceData.municipalities.length > 0;
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
  const [isMounted, setIsMounted] = useState(false);
  // Flag to control form data saving
  const [shouldSaveFormData, setShouldSaveFormData] = useState(false);


  // Define read-only fields that are populated from Firebase
  const readOnlyFields = useMemo(() => ['firstName', 'lastName', 'email', 'dateOfBirth', 'gender'], []);


  // Merge initial data with defaults
  const mergedInitialData = initialData ? { ...defaultFormData, ...initialData } : defaultFormData;
 
  // Ensure we initialize with local storage if available
  const [formData, setFormData] = useLocalStorage<typeof defaultFormData>("personalDetailsForm", mergedInitialData);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
    mode: "onChange"
  });


  // Set component as mounted after first render
  useEffect(() => {
    setIsMounted(true);
   
    // This ensures the form values are properly restored from localStorage
    // after the component is mounted
    const storedData = localStorage.getItem("personalDetailsForm");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Make sure city and municipality are null rather than undefined or empty strings
        if (!parsedData.city) parsedData.city = null;
        if (!parsedData.municipality) parsedData.municipality = null;
       
        // Only update form with stored data if it's meaningfully different
        if (JSON.stringify(parsedData) !== JSON.stringify(form.getValues())) {
          form.reset(parsedData);
        }
       
        // If we have location data, make sure the dropdowns are populated
        if (parsedData.region) {
          updateProvinces(parsedData.region);
          if (parsedData.province) {
            updateLocations(parsedData.region, parsedData.province);
          }
        }
      } catch (e) {
        console.error("Error parsing stored form data:", e);
      }
    }
  }, []);


  // Watch form values
  const currentRegion = form.watch("region");
  const currentProvince = form.watch("province");
  const currentCity = form.watch("city");
  const currentMunicipality = form.watch("municipality");


  // Helper function to safely get zip code
  const getZipCode = useCallback((region: string, province: string, city?: string | null, municipality?: string | null): string => {
    // Check if region exists in zipCodeMapping
    if (!(region in typedZipCodeMapping)) return "";
   
    const regionData = typedZipCodeMapping[region];
   
    // Check if province exists in the region
    if (!(province in regionData.provinces)) return regionData.default;
   
    const provinceData = regionData.provinces[province];
   
    // If city is provided and exists in province data
    if (city && city in provinceData.cities) {
      return provinceData.cities[city];
    }
   
    // If municipality is provided and exists in province data
    if (municipality && municipality in provinceData.municipalities) {
      return provinceData.municipalities[municipality];
    }
   
    // Return province default or region default as fallback
    return provinceData.default || regionData.default;
  }, []);


  // Update provinces when region changes
  const updateProvinces = useCallback((region: string) => {
    if (region && region in typedLocationHierarchy) {
      const regionData = typedLocationHierarchy[region];
      setAvailableProvinces([...regionData.provinces].sort());
    } else {
      setAvailableProvinces([]);
    }
  }, []);


  // Update cities and municipalities when province changes
  const updateLocations = useCallback((region: string, province: string) => {
    if (region && province && region in typedLocationHierarchy) {
      const regionData = typedLocationHierarchy[region];
      if (province in regionData.locations) {
        const locations = regionData.locations[province];
        setAvailableCities([...locations.cities].sort());
        setAvailableMunicipalities([...locations.municipalities].sort());
      } else {
        setAvailableCities([]);
        setAvailableMunicipalities([]);
      }
    } else {
      setAvailableCities([]);
      setAvailableMunicipalities([]);
    }
  }, []);


  // Initialize provinces when region is set
  useEffect(() => {
    if (!isMounted) return;
    if (currentRegion) updateProvinces(currentRegion);
  }, [currentRegion, updateProvinces, isMounted]);


  // Reset dependent fields when region changes
  useEffect(() => {
    if (!isMounted || !formDataLoaded) return;
   
    if (currentRegion && formData?.region !== currentRegion) {
      form.setValue("province", "");
      form.setValue("city", null);
      form.setValue("municipality", null);
      form.setValue("zipCode", "");
      setAvailableCities([]);
      setAvailableMunicipalities([]);
    }
  }, [currentRegion, form, formData?.region, formDataLoaded, isMounted]);


  // Update locations when province changes
  useEffect(() => {
    if (!isMounted || !formDataLoaded) return;
   
    if (currentRegion && currentProvince) {
      updateLocations(currentRegion, currentProvince);
     
      if (formData?.province !== currentProvince) {
        form.setValue("city", null);
        form.setValue("municipality", null);
       
        // Set default zip code for the province if available
        const defaultZipCode = getZipCode(currentRegion, currentProvince);
        form.setValue("zipCode", defaultZipCode);
      }
    }
  }, [currentRegion, currentProvince, updateLocations, form, formData?.province, formDataLoaded, getZipCode, isMounted]);


  // Handle city selection
  useEffect(() => {
    if (!isMounted || !formDataLoaded) return;
   
    if (currentRegion && currentProvince && currentCity) {
      // Clear municipality when city is selected
      if (form.getValues("municipality")) form.setValue("municipality", null);
     
      // Update zip code based on selected city
      const zipCode = getZipCode(currentRegion, currentProvince, currentCity);
      if (zipCode) form.setValue("zipCode", zipCode);
    }
  }, [currentCity, currentProvince, currentRegion, form, formDataLoaded, getZipCode, isMounted]);


  // Handle municipality selection
  useEffect(() => {
    if (!isMounted || !formDataLoaded) return;
   
    if (currentRegion && currentProvince && currentMunicipality) {
      // Clear city when municipality is selected
      if (form.getValues("city")) form.setValue("city", null);
     
      // Update zip code based on selected municipality
      const zipCode = getZipCode(currentRegion, currentProvince, undefined, currentMunicipality);
      if (zipCode) form.setValue("zipCode", zipCode);
    }
  }, [currentMunicipality, currentProvince, currentRegion, form, formDataLoaded, getZipCode, isMounted]);


  // Set default province zip code if neither city nor municipality is selected
  useEffect(() => {
    if (!isMounted || !formDataLoaded) return;
   
    if (currentRegion && currentProvince && !currentCity && !currentMunicipality) {
      const defaultZipCode = getZipCode(currentRegion, currentProvince);
      form.setValue("zipCode", defaultZipCode);
    }
  }, [currentCity, currentMunicipality, currentProvince, currentRegion, form, formDataLoaded, getZipCode, isMounted]);


  // Handle saving form data to localStorage - optimized approach with a single useEffect
  useEffect(() => {
    if (!isMounted || !formDataLoaded) return;
   
    // Use a more efficient approach to watch form changes
    const subscription = form.watch((formValues) => {
      setShouldSaveFormData(true);
    });
   
    return () => {
      subscription.unsubscribe();
    };
  }, [form, isMounted, formDataLoaded]);
 
  // Separate effect to handle the actual saving to prevent infinite loops
  useEffect(() => {
    if (shouldSaveFormData && isMounted && formDataLoaded) {
      const currentValues = form.getValues();
     
      // Make sure null values are preserved
      if (!currentValues.city) currentValues.city = null;
      if (!currentValues.municipality) currentValues.municipality = null;
     
      // Ensure read-only fields from Firebase are preserved
      if (userProfileData) {
        readOnlyFields.forEach(field => {
          // Keep the Firebase data for read-only fields
          currentValues[field as keyof typeof currentValues] = userProfileData[field] || currentValues[field as keyof typeof currentValues];
        });
      }
     
      // Update local storage through the hook
      setFormData(currentValues as typeof defaultFormData);
     
      // Reset the flag
      setShouldSaveFormData(false);
    }
  }, [shouldSaveFormData, setFormData, form, isMounted, formDataLoaded, userProfileData, readOnlyFields]);


  // Before unloading the page, save form data to ensure it persists
  useEffect(() => {
    if (!isMounted) return;
   
    const handleBeforeUnload = () => {
      const currentFormValues = form.getValues();
     
      // Ensure read-only fields from Firebase are preserved
      if (userProfileData) {
        readOnlyFields.forEach(field => {
          // Keep the Firebase data for read-only fields
          currentFormValues[field as keyof typeof currentFormValues] = userProfileData[field] || currentFormValues[field as keyof typeof currentFormValues];
        });
      }
     
      localStorage.setItem("personalDetailsForm", JSON.stringify(currentFormValues));
    };
   
    window.addEventListener('beforeunload', handleBeforeUnload);
   
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form, isMounted, userProfileData, readOnlyFields]);


  // Fetch user data on component mount
  useEffect(() => {
    if (!isMounted) return;
   
    if (user && !formDataLoaded) {
      const fetchUserData = async () => {
        try {
          console.log("Fetching user data from Firebase...");
          const userDoc = await getDoc(doc(db, "accounts", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data fetched:", userData);
            setUserProfileData(userData);
           
            // Create merged form data with all sources
            const storedData = localStorage.getItem("personalDetailsForm");
            const parsedStoredData = storedData ? JSON.parse(storedData) : {};
           
            // IMPORTANT: Always prioritize Firebase data for read-only fields
            const formData = {
              ...defaultFormData,
              // First populate with stored data
              ...parsedStoredData,
              // Then override with Firebase data for read-only fields
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              email: userData.email || "",
              dateOfBirth: userData.dateOfBirth || "",
              gender: userData.gender || "",
            };
           
            // Log to check gender value
            console.log("Setting gender from Firebase:", userData.gender);
           
            // Ensure city and municipality are properly handled
            if (!formData.city) formData.city = null;
            if (!formData.municipality) formData.municipality = null;
           
            console.log("Setting form data:", formData);
            form.reset(formData);
           
            // Set form data to localStorage
            setFormData(formData);
           
            // Initialize location fields if region and province are available
            if (formData.region && formData.province) {
              updateProvinces(formData.region);
              updateLocations(formData.region, formData.province);
             
              // Set zip code appropriately
              if (formData.city) {
                const zipCode = getZipCode(formData.region, formData.province, formData.city);
                form.setValue("zipCode", zipCode);
              } else if (formData.municipality) {
                const zipCode = getZipCode(formData.region, formData.province, undefined, formData.municipality);
                form.setValue("zipCode", zipCode);
              } else {
                const zipCode = getZipCode(formData.region, formData.province);
                form.setValue("zipCode", zipCode);
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
  }, [user, form, setFormData, formDataLoaded, updateProvinces, updateLocations, getZipCode, isMounted]);


  // NEW: Re-apply Firebase data whenever the form is rendered or the component is re-mounted
  useEffect(() => {
    if (!isMounted || !userProfileData) return;
   
    // Get current form values
    const currentValues = form.getValues();
    let needsUpdate = false;
   
    // Check if any read-only fields need updating
    readOnlyFields.forEach(field => {
      const fieldKey = field as keyof typeof currentValues;
      if (userProfileData[field] && currentValues[fieldKey] !== userProfileData[field]) {
        currentValues[fieldKey] = userProfileData[field];
        needsUpdate = true;
      }
    });
   
    // Update form if needed
    if (needsUpdate) {
      form.reset(currentValues);
     
      // Also update local storage
      setFormData(currentValues as typeof defaultFormData);
      localStorage.setItem("personalDetailsForm", JSON.stringify(currentValues));
    }
  }, [isMounted, userProfileData, form, readOnlyFields, setFormData]);


  // Form submission handler - memoized for performance
  const handleSubmit = useCallback((data: z.infer<typeof formSchema>) => {
    // Ensure we preserve the original read-only fields from Firebase
    const submissionData = { ...data };
   
    if (userProfileData) {
      readOnlyFields.forEach(field => {
        submissionData[field as keyof typeof submissionData] = userProfileData[field] || data[field as keyof typeof data];
      });
    }
   
    // Make sure nulls are preserved
    if (!submissionData.city) submissionData.city = null;
    if (!submissionData.municipality) submissionData.municipality = null;
   
    // Save the final data both to the hook and directly to localStorage
    setFormData(submissionData as typeof defaultFormData);
    localStorage.setItem("personalDetailsForm", JSON.stringify(submissionData));
   
    onSubmit(submissionData);
  }, [onSubmit, setFormData, userProfileData, readOnlyFields]);


  // Reset form handler - only clear non-read-only fields
  const handleReset = useCallback(() => {
    if (!isMounted) return;
   
    const resetValues = { ...defaultFormData };
   
    // Preserve read-only fields from Firebase
    if (userProfileData) {
      readOnlyFields.forEach(field => {
        resetValues[field as keyof typeof defaultFormData] = userProfileData[field] || defaultFormData[field as keyof typeof defaultFormData];
      });
    }
   
    form.reset(resetValues);
    setFormData(resetValues);
    localStorage.setItem("personalDetailsForm", JSON.stringify(resetValues));
    setAvailableCities([]);
    setAvailableMunicipalities([]);
  }, [form, setFormData, readOnlyFields, isMounted, userProfileData]);


  // Prepare field props factory for optimization
  const getFieldProps = useCallback((fieldName: string) => {
    const isReadOnly = readOnlyFields.includes(fieldName);
    return {
      disabled: isReadOnly,
      className: `bg-white/50 ${isReadOnly ? 'cursor-not-allowed opacity-80 border-blue-300 border-2' : ''}`,
      title: isReadOnly ? "This field is auto-filled from your profile" : ""
    };
  }, [readOnlyFields]);


  // Get consistent styling for select fields
  const getSelectFieldProps = useCallback((fieldName: string) => {
    const isReadOnly = readOnlyFields.includes(fieldName);
    return {
      disabled: isReadOnly,
      className: `bg-white/50 ${isReadOnly ? 'cursor-not-allowed opacity-80 border-blue-300 border-2' : ''}`,
      title: isReadOnly ? "This field is auto-filled from your profile" : ""
    };
  }, [readOnlyFields]);


  // Don't render the full form until client-side hydration is complete
  if (!isMounted) {
    return <div className="flex items-center justify-center p-8">Loading form...</div>;
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
                  <Input placeholder="First Name" {...field} {...getFieldProps("firstName")} />
                </FormControl>
                <FormMessage className="text-red-500" />
                {readOnlyFields.includes("firstName") && (
                  <p className="text-xs text-blue-600">Auto-filled from profile</p>
                )}
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
                <FormMessage className="text-red-500" />
                {readOnlyFields.includes("lastName") && (
                  <p className="text-xs text-blue-600">Auto-filled from profile</p>
                )}
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
                    {...field}
                    {...getFieldProps("gender")}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
                {readOnlyFields.includes("gender") && (
                  <p className="text-xs text-blue-600">Auto-filled from profile</p>
                )}
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
                <FormMessage className="text-red-500" />
                {readOnlyFields.includes("dateOfBirth") && (
                  <p className="text-xs text-blue-600">Auto-filled from profile</p>
                )}
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
                <FormMessage className="text-red-500" />
                {readOnlyFields.includes("email") && (
                  <p className="text-xs text-blue-600">Auto-filled from profile</p>
                )}
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
                     
                      // Don't save here - let the watch handler do it
                      setShouldSaveFormData(true);
                    }}
                    className="bg-white/50"
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
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
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Don't save directly here - let the watch handler handle it
                    setShouldSaveFormData(true);
                  }}
                  value={field.value}
                >
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
                <FormMessage className="text-red-500" />
                <p className="text-xs text-gray-500">My Current Geographical Area</p>
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
                    field.onChange(value);
                    // Don't save directly here - let the watch handler handle it
                    setShouldSaveFormData(true);
                  }}
                  value={field.value}
                  disabled={!availableProvinces.length}
                >
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
                <FormMessage className="text-red-500" />
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
                <FormMessage className="text-red-500" />
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
                    field.onChange(value || null);
                    // Don't save directly here - let the watch handler handle it
                    setShouldSaveFormData(true);
                  }}
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
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-500" />
                <p className="text-xs text-gray-500">Select a city or municipality</p>
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
                    field.onChange(value || null);
                    // Don't save directly here - let the watch handler handle it
                    setShouldSaveFormData(true);
                  }}
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

