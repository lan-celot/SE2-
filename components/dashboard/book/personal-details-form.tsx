"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Type definitions for location data
type City = string;
type Province = string;
type Region = string;

interface LocationData {
  provinces: Province[];
  cities: {
    [province: string]: City[];
  };
}

interface LocationHierarchy {
  [region: string]: LocationData;
}

// Philippine location data
const philippineRegions = [
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
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"
].sort();

// Sample hierarchical data structure with proper typing
const locationHierarchy: LocationHierarchy = {
  "Region I (Ilocos Region)": {
    "provinces": ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan", "Quezon City", "San Juan"],
    "cities": {
      "Ilocos Norte": ["Laoag", "Batac"],
      "Ilocos Sur": ["Vigan", "Candon"],
      "La Union": ["San Fernando"],
      "Pangasinan": ["Dagupan", "Alaminos", "San Carlos", "Urdaneta"]
    }
  },
"Region II (Cagayan Valley)": {
    "provinces": ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
    "cities": {
      "Batanes": [],
      "Cagayan": ["Tuguegarao"],
      "Isabela": ["Cauayan", "Ilagan", "Santiago"],
      "Nueva Vizcaya": [],
      "Quirino": []
    }
  },

  "Region III (Central Luzon)": {
    "provinces": ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"],
    "cities": {
      "Aurora": [],
      "Bataan": ["Balanga"],
      "Bulacan": ["Malolos", "Meycauayan", "San Jose del Monte"],
      "Nueva Ecija": ["Cabanatuan", "Gapan", "Muñoz", "Palayan", "San Jose"],
      "Pampanga": ["San Fernando", "Angeles", "Mabalacat"],
      "Tarlac": ["Tarlac City"],
      "Zambales": ["Olongapo"]
    }
  },
  "Region IV-A (CALABARZON)": {
    "provinces": ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"],
    "cities": {
      "Batangas": ["Batangas City", "Lipa", "Tanauan", "Santo Tomas", "Calaca"],
      "Cavite": ["Bacoor", "Cavite City", "Dasmariñas", "Imus", "Tagaytay", "Trece Martires", "General Trias", "Tanza"],
      "Laguna": ["Biñan", "Cabuyao", "Calamba", "San Pablo", "San Pedro", "Santa Rosa"],
      "Quezon": ["Lucena", "Tayabas"],
      "Rizal": ["Antipolo"]
    }
  },
    "Region IV-B (MIMAROPA)": {
      "provinces": ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"],
      "cities": {
        "Marinduque": [],
        "Occidental Mindoro": [],
        "Oriental Mindoro": ["Calapan"],
        "Palawan": ["Puerto Princesa"],
        "Romblon": []
      }
    },
  "Region V (Bicol Region)": {
    provinces: ["Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon"],
    cities: {
      "Albay": ["Legazpi", "Ligao", "Tabaco"],
      "Camarines Norte": [],
      "Camarines Sur": ["Iriga", "Naga"],
      "Catanduanes": [],
      "Masbate": ["Masbate City"],
      "Sorsogon": ["Sorsogon City"]
    }
  },
  "Region VI (Western Visayas)": {
    provinces: ["Aklan", "Antique", "Capiz", "Guimaras", "Iloilo", "Negros Occidental"],
    cities: {
      "Aklan": ["Kalibo"],
      "Antique": ["San Jose de Buenavista"],
      "Capiz": ["Roxas City"],
      "Guimaras": [],
      "Iloilo": ["Iloilo City", "Passi"],
      "Negros Occidental": ["Bago", "Bacolod", "Cadiz", "Escalante", "Himamaylan", "Kabankalan", "La Carlota", "Sagay", "San Carlos", "Silay", "Sipalay", "Talisay", "Victorias"]
    }
  },
  "Region VII (Central Visayas)": {
      "provinces": ["Bohol", "Cebu", "Negros Oriental", "Siquijor"],
      "cities": {
        "Bohol": ["Tagbilaran"],
        "Cebu": ["Bogo", "Carcar", "Cebu City", "Danao", "Lapu-Lapu", "Mandaue", "Naga", "Talisay", "Toledo"],
        "Negros Oriental": ["Bais", "Bayawan", "Canlaon", "Dumaguete", "Guihulngan", "Tanjay"],
        "Siquijor": []
    }
  },
  "Region VIII (Eastern Visayas)": {
    "provinces": ["Biliran", "Eastern Samar", "Leyte", "Northern Samar", "Samar", "Southern Leyte"],
    "cities": {
      "Biliran": [],
      "Eastern Samar": ["Borongan"],
      "Leyte": ["Tacloban", "Ormoc", "Baybay"],
      "Northern Samar": ["Catarman"],
      "Samar": ["Calbayog", "Catbalogan"],
      "Southern Leyte": ["Maasin"]
    }
  },

  "Region IX (Zamboanga Peninsula)": {
    "provinces": ["Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay", "Others"],
    "cities": {
      "Zamboanga del Norte": ["Dapitan", "Dipolog"],
      "Zamboanga del Sur": ["Pagadian"],
      "Zamboanga Sibugay": [],
      "Highly Urbanized": ["Zamboanga City"],
      "Others": ["Isabela"] 
    }
  },
    "Region X (Northern Mindanao)": {
      "provinces": ["Bukidnon", "Camiguin", "Lanao del Norte", "Misamis Occidental", "Misamis Oriental"],
      "cities": {
        "Bukidnon": ["Malaybalay", "Valencia"],
        "Camiguin": [],
        "Lanao del Norte": ["Iligan"],
        "Misamis Occidental": ["Oroquieta", "Ozamiz", "Tangub"],
        "Misamis Oriental": ["Gingoog", "El Salvador", "Cagayan de Oro"],
    }
  },
  "Region XI (Davao Region)": {
    "provinces": ["Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental"],
    "cities": {
      "Davao de Oro": [],
      "Davao del Norte": ["Panabo", "Samal", "Tagum"],
      "Davao del Sur": ["Digos"],
      "Davao Occidental": [],
      "Davao Oriental": ["Mati"],
      "Others": ["Davao City"]
    }
  },
  "Region XII (SOCCSKSARGEN)": {
    "provinces": ["Cotabato", "Sarangani", "South Cotabato", "Sultan Kudarat"],
    "cities": {
      "Cotabato": ["Kidapawan"],
      "Sarangani": [],
      "South Cotabato": ["Koronadal", "General Santos"],
      "Sultan Kudarat": ["Tacurong"],
      "Others": ["Cotabato City"]
    }
  },
  "Region XIII (Caraga)": {
    "provinces": ["Agusan del Norte", "Agusan del Sur", "Dinagat Islands", "Surigao del Norte", "Surigao del Sur"],
    "cities": {
      "Agusan del Norte": ["Cabadbaran"],
      "Agusan del Sur": ["Bayugan"],
      "Dinagat Islands": [],
      "Surigao del Norte": ["Surigao"],
      "Surigao del Sur": ["Bislig", "Tandag"],
      "Others": ["Butuan"]
    }
  },
  "National Capital Region (NCR)": {
    "provinces": ["Metro Manila District I", "Metro Manila District II", "Metro Manila District III", "Metro Manila District IV",],
    "cities": {
      "Metro Manila District I": ["Manila"],
      "Metro Manila District II": ["Mandaluyong", "Marikina", "Pasig", "Quezon City", "San Juan"],
      "Metro Manila District III": ["Caloocan", "Malabon", "Navotas", "Valenzuela"],
      "Metro Manila District IV": ["Las Piñas", "Makati", "Muntinlupa", "Parañaque", "Pasay", "Pateros", "Taguig"]
    }
  },
  "Cordillera Administrative Region (CAR)": {
    "provinces": ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"],
    "cities": {
      "Abra": [],
      "Apayao": [],
      "Benguet": ["Baguio"],
      "Ifugao": [],
      "Kalinga": ["Tabuk"],
      "Mountain Province": []
  }
},
"Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)": {
  "provinces": ["Basilan", "Lanao del Sur", "Maguindanao del Norte", "Maguindanao del Sur", "Sulu", "Tawi-Tawi"],
  "cities": {
    "Basilan": ["Lamitan"],
    "Lanao del Sur": ["Marawi"],
    "Maguindanao del Norte": ["Cotabato"],
    "Maguindanao del Sur": [],
    "Sulu": [],
    "Tawi-Tawi": []
  }
},
};

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.string().min(1, "Gender is required"),
  phoneNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in format: 09XXXXXXXXX"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  region: z.string().min(1, "Region is required"),
  province: z.string().min(1, "Province is required"),
  city: z.string().optional(), // Make city optional
  zipCode: z.string().min(1, "ZIP code is required"),
}).refine((data) => {
  const selectedProvince = data.province;
  if (selectedProvince && locationHierarchy[data.region]?.cities[selectedProvince]?.length > 0) {
    return !!data.city; // Require city if province has cities
  }
  return true; // Allow proceeding if the province has no cities
}, {
  message: "City is required if the province has cities",
  path: ["city"],
});


interface PersonalDetailsFormProps {
  initialData: any
  onSubmit: (data: any) => void
}

export function PersonalDetailsForm({ initialData, onSubmit }: PersonalDetailsFormProps) {
  const auth = getAuth()
  const user = auth.currentUser
  
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      firstName: "",
      lastName: "",
      gender: "",
      phoneNumber: "",
      dateOfBirth: "",
      streetAddress: "",
      region: "",
      province: "",
      city: "",
      zipCode: "",
    },
  })

  // Update provinces when region changes
  useEffect(() => {
    const selectedRegion = form.watch("region")
    
    if (selectedRegion && selectedRegion in locationHierarchy) {
      const provinces = locationHierarchy[selectedRegion].provinces
      setAvailableProvinces([...provinces].sort())
      
      // Clear province and city when region changes
      form.setValue("province", "")
      form.setValue("city", "")
      setAvailableCities([])
    }
  }, [form.watch("region")])

  // Update cities when province changes
  useEffect(() => {
    const selectedRegion = form.watch("region")
    const selectedProvince = form.watch("province")
    
    if (
      selectedRegion && 
      selectedProvince && 
      selectedRegion in locationHierarchy && 
      selectedProvince in locationHierarchy[selectedRegion].cities
    ) {
      const cities = locationHierarchy[selectedRegion].cities[selectedProvince]
      setAvailableCities([...cities].sort())
      
      // Clear city when province changes
      form.setValue("city", "")
    }
  }, [form.watch("province")])

  // Fetch user data from Firebase
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          form.reset({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            gender: userData.gender || "",
            phoneNumber: userData.phoneNumber || "",
            dateOfBirth: userData.dateOfBirth || "",
            streetAddress: userData.streetAddress || "",
            region: userData.region || "",
            province: userData.province || "",
            city: userData.city || "",
            zipCode: userData.zipCode || "",
          })
        }
      }
      fetchUserData()
    }
  }, [user, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="streetAddress"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Street Address" className="bg-white/50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                <Select onValueChange={field.onChange} value={field.value} disabled={availableProvinces.length === 0}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Province" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56 overflow-y-auto">
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

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value} disabled={availableCities.length === 0}>
                  <FormControl>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-56 overflow-y-auto">
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
        </div>

        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="ZIP Code" className="bg-white/50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" className="bg-[#1e4e8c] text-white">
            Proceed
          </Button>
        </div>
      </form>
    </Form>
  )
}