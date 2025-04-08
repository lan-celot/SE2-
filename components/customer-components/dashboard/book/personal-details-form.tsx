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
    email: z.string().email("Email is required").min(1, "Invalid email address"),
    phoneNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in format: 09XXXXXXXXX"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    region: z.string().min(1, "Region is required"),
    province: z.string().min(1, "Province is required"),
    city: z.string().optional(),
    municipality: z.string().optional(),
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

  // Merge initial data with defaults
  const mergedInitialData = initialData ? { ...defaultFormData, ...initialData } : defaultFormData;
  const [formData, setFormData] = useLocalStorage("personalDetailsForm", mergedInitialData);

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

  // Helper function to safely get zip code
  const getZipCode = (region: string, province: string, city?: string, municipality?: string): string => {
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
  };

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
      form.setValue("city", "");
      form.setValue("municipality", "");
      form.setValue("zipCode", "");
      setAvailableCities([]);
      setAvailableMunicipalities([]);
    }
  }, [currentRegion, form, formData.region, formDataLoaded]);

  // Update locations when province changes
  useEffect(() => {
    if (currentRegion && currentProvince) {
      updateLocations(currentRegion, currentProvince);
      
      if (formDataLoaded && formData.province !== currentProvince) {
        form.setValue("city", "");
        form.setValue("municipality", "");
        form.setValue("zipCode", "");
      }
    }
  }, [currentRegion, currentProvince, updateLocations, form, formData.province, formDataLoaded]);

  // Handle city selection
  useEffect(() => {
    if (!formDataLoaded) return;
    
    if (currentRegion && currentProvince && currentCity) {
      if (form.getValues("municipality")) form.setValue("municipality", "");
      
      const zipCode = getZipCode(currentRegion, currentProvince, currentCity);
      if (zipCode) form.setValue("zipCode", zipCode);
    }
  }, [currentCity, currentProvince, currentRegion, form, formDataLoaded]);

  // Handle municipality selection
  useEffect(() => {
    if (!formDataLoaded) return;
    
    if (currentRegion && currentProvince && currentMunicipality) {
      if (form.getValues("city")) form.setValue("city", "");
      
      const zipCode = getZipCode(currentRegion, currentProvince, undefined, currentMunicipality);
      if (zipCode) form.setValue("zipCode", zipCode);
    }
  }, [currentMunicipality, currentProvince, currentRegion, form, formDataLoaded]);

  // Clear ZIP code if neither city nor municipality is selected
  useEffect(() => {
    if (formDataLoaded && currentRegion && currentProvince && !currentCity && !currentMunicipality) {
      form.setValue("zipCode", "");
    }
  }, [currentCity, currentMunicipality, currentProvince, currentRegion, form, formDataLoaded]);

  // Save form data to localStorage
  useEffect(() => {
    if (!formDataLoaded) return;
    
    const subscription = form.watch((formValues) => {
      if (formValues) {
        const timeoutId = setTimeout(() => setFormData(formValues), 300);
        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, formDataLoaded, setFormData]);

  // Fetch user data on component mount
  useEffect(() => {
    if (user && !formDataLoaded) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
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

  // Form submission handler
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    setFormData(data);
    onSubmit(data);
  };

  // Reset form handler
  const handleReset = () => {
    form.reset(defaultFormData);
    setFormData(defaultFormData);
    setAvailableCities([]);
    setAvailableMunicipalities([]);
  };

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
                  <Input placeholder="First Name" className="bg-white/50" {...field} />
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
                  <Input placeholder="Last Name" className="bg-white/50" {...field} />
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
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
                  <Input type="date" placeholder="Date of Birth" className="bg-white/50" {...field} />
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
                  <Input type="email" placeholder="Email Address" className="bg-white/50" {...field} />
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
                  <Input placeholder="Phone Number (09XXXXXXXXX)" className="bg-white/50" {...field} />
                </FormControl>
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
                <Select onValueChange={field.onChange} value={field.value} 
                  disabled={!availableCities.length || !currentProvince}>
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
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="municipality"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value} 
                  disabled={!availableMunicipalities.length || !currentProvince}>
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
                <Input placeholder="House No. & Street, Subdivision/Barangay" className="bg-white/50" {...field} />
              </FormControl>
              <FormMessage />
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