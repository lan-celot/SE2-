"use client"

import { useEffect, useState } from "react"
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

// Type definitions for location data
type City = string
type Province = string
type Region = string

interface LocationData {
  provinces: Province[]
  cities: {
    [province: string]: City[]
  }
}

interface LocationHierarchy {
  [region: string]: LocationData
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
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
].sort()

// Sample hierarchical data structure with proper typing
const locationHierarchy: LocationHierarchy = {
  "Region I (Ilocos Region)": {
    provinces: ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan", "Quezon City", "San Juan"],
    cities: {
      "Ilocos Norte": ["Laoag", "Batac", "Paoay", "Pagudpud"],
      "Ilocos Sur": ["Vigan", "Candon", "Bantay", "Narvacan"],
      "La Union": ["San Fernando", "Agoo", "Bauang"],
      Pangasinan: [
        "Dagupan",
        "Alaminos",
        "San Carlos",
        "Urdaneta",
        "Lingayen",
        "Bayambang",
        "Binmaley",
        "Mangaldan",
        "Rosales",
      ],
    },
  },
  "Region II (Cagayan Valley)": {
    provinces: ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
    cities: {
      Batanes: ["Basco", "Ivana", "Mahatao", "Sabtang", "Uyugan", "Itbayat"],
      Cagayan: [
        "Tuguegarao",
        "Aparri",
        "Ballesteros",
        "Gonzaga",
        "Lal-lo",
        "Peñablanca",
        "Santa Ana",
        "Claveria",
        "Camalaniugan",
        "Tuao",
        "Gattaran",
      ],
      Isabela: [
        "Cauayan",
        "Ilagan",
        "Santiago",
        "Alicia",
        "Cabagan",
        "Echague",
        "Roxas",
        "Tumauini",
        "San Mateo",
        "Angadanan",
      ],
      "Nueva Vizcaya": [
        "Bayombong",
        "Solano",
        "Bambang",
        "Aritao",
        "Bagabag",
        "Kasibu",
        "Dupax del Norte",
        "Dupax del Sur",
      ],
      Quirino: ["Cabarroguis", "Diffun", "Maddela", "Nagtipunan", "Saguday"],
    },
  },
  "Region III (Central Luzon)": {
    provinces: ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"],
    cities: {
      Aurora: ["Baler", "Casiguran", "Dilasag", "Dinalungan", "Dingalan", "Dipaculao", "Maria Aurora", "San Luis"],
      Bataan: [
        "Balanga",
        "Abucay",
        "Bagac",
        "Dinalupihan",
        "Hermosa",
        "Limay",
        "Mariveles",
        "Morong",
        "Orani",
        "Orion",
        "Pilar",
        "Samal",
      ],
      Bulacan: [
        "Malolos",
        "Meycauayan",
        "San Jose del Monte",
        "Baliuag",
        "Plaridel",
        "Pulilan",
        "Santa Maria",
        "San Miguel",
        "Hagonoy",
        "Guiguinto",
      ],
      "Nueva Ecija": [
        "Cabanatuan",
        "Gapan",
        "Muñoz",
        "Palayan",
        "San Jose",
        "Aliaga",
        "Bongabon",
        "Guimba",
        "Jaen",
        "San Leonardo",
        "Zaragoza",
      ],
      Pampanga: [
        "San Fernando",
        "Angeles",
        "Mabalacat",
        "Lubao",
        "Porac",
        "Mexico",
        "Arayat",
        "Floridablanca",
        "Macabebe",
        "Santa Rita",
      ],
      Tarlac: [
        "Tarlac City",
        "Concepcion",
        "Capas",
        "Paniqui",
        "Gerona",
        "Victoria",
        "Bamban",
        "San Manuel",
        "Mayantoc",
        "Camiling",
      ],
      Zambales: [
        "Olongapo",
        "Iba",
        "Subic",
        "San Antonio",
        "San Narciso",
        "San Marcelino",
        "Botolan",
        "Masinloc",
        "Palauig",
        "Candelaria",
      ],
    },
  },
  "Region IV-A (CALABARZON)": {
    provinces: ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"],
    cities: {
      Batangas: ["Batangas City", "Lipa", "Tanauan", "Santo Tomas", "Calaca", "Balayan", "Bauan", "Nasugbu"],
      Cavite: [
        "Cavite City",
        "Bacoor",
        "Dasmariñas",
        "Imus",
        "Tagaytay",
        "Trece Martires",
        "General Trias",
        "Tanza",
        "Noveleta",
        "Naic",
      ],
      Laguna: [
        "Biñan",
        "Cabuyao",
        "Calamba",
        "San Pablo",
        "San Pedro",
        "Santa Rosa",
        "Los Baños",
        "Pagsanjan",
        "Liliw",
      ],
      Quezon: ["Lucena", "Tayabas", "Sariaya", "Candelaria", "Gumaca"],
      Rizal: ["Antipolo", "Taytay", "Binangonan", "Cainta", "Rodriguez"],
    },
  },
  "Region IV-B (MIMAROPA)": {
    provinces: ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"],
    cities: {
      Marinduque: ["Boac", "Mogpog", "Santa Cruz", "Torrijos", "Gasan", "Buenavista"],
      "Occidental Mindoro": ["Mamburao", "Sablayan", "San Jose", "Rizal"],
      "Oriental Mindoro": ["Calapan", "Pinamalayan", "Roxas", "Naujan", "Bansud"],
      Palawan: ["Puerto Princesa", "Coron", "El Nido", "Roxas", "Brooke's Point", "Narra"],
      Romblon: ["Odiongan", "Romblon", "Cajidiocan", "San Fernando", "Santa Fe"],
    },
  },
  "Region V (Bicol Region)": {
    provinces: ["Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon"],
    cities: {
      Albay: ["Legazpi", "Ligao", "Tabaco", "Daraga", "Guinobatan", "Malilipot", "Polangui", "Camalig"],
      "Camarines Norte": ["Daet", "Labo", "Vinzons", "Talisay", "Jose Panganiban"],
      "Camarines Sur": ["Iriga", "Naga", "Caramoan", "Buhi", "Baao", "Bato", "Pili"],
      Catanduanes: ["Virac", "San Andres", "Baras", "Bato", "Panganiban"],
      Masbate: ["Masbate City", "Aroroy", "Mobo", "Milagros", "Esperanza", "Cawayan"],
      Sorsogon: ["Sorsogon City", "Casiguran", "Bulan", "Gubat", "Irosin", "Castilla"],
    },
  },
  "Region VI (Western Visayas)": {
    provinces: ["Aklan", "Antique", "Capiz", "Guimaras", "Iloilo", "Negros Occidental"],
    cities: {
      Aklan: ["Kalibo", "Malay (Boracay)", "Banga", "Numancia", "Ibajay"],
      Antique: ["San Jose de Buenavista", "Tibiao", "Pandan", "Hamtic"],
      Capiz: ["Roxas City", "Pontevedra", "Panay", "Sigma"],
      Guimaras: ["Jordan", "Buenavista", "Nueva Valencia", "San Lorenzo"],
      Iloilo: ["Iloilo City", "Passi", "Dumangas", "Pototan", "Oton", "Janiuay", "Santa Barbara"],
      "Negros Occidental": [
        "Bago",
        "Bacolod",
        "Cadiz",
        "Escalante",
        "Himamaylan",
        "Kabankalan",
        "La Carlota",
        "Sagay",
        "San Carlos",
        "Silay",
        "Sipalay",
        "Talisay",
        "Victorias",
        "Moises Padilla",
        "Valladolid",
        "Manapla",
        "Candoni",
        "Pulupandan",
      ],
    },
  },
  "Region VII (Central Visayas)": {
    provinces: ["Bohol", "Cebu", "Negros Oriental", "Siquijor"],
    cities: {
      Bohol: ["Tagbilaran", "Ubay", "Carmen", "Tubigon", "Jagna", "Talibon"],
      Cebu: [
        "Bogo",
        "Carcar",
        "Cebu City",
        "Danao",
        "Lapu-Lapu",
        "Mandaue",
        "Naga",
        "Talisay",
        "Toledo",
        "Daanbantayan",
        "Minglanilla",
        "Balamban",
        "Consolacion",
      ],
      "Negros Oriental": [
        "Bais",
        "Bayawan",
        "Canlaon",
        "Dumaguete",
        "Guihulngan",
        "Tanjay",
        "Sibulan",
        "Valencia",
        "Dauin",
        "Basay",
      ],
      Siquijor: ["Siquijor", "Larena", "Lazi", "Maria", "Enrique Villanueva", "San Juan"],
    },
  },
  "Region VIII (Eastern Visayas)": {
    provinces: ["Biliran", "Eastern Samar", "Leyte", "Northern Samar", "Samar", "Southern Leyte"],
    cities: {
      Biliran: ["Naval"],
      "Eastern Samar": ["Borongan", "Guiuan"],
      Leyte: ["Tacloban", "Ormoc", "Baybay", "Palo", "Abuyog", "Carigara", "Hilongos"],
      "Northern Samar": ["Catarman", "Laoang", "Bobon"],
      Samar: ["Calbayog", "Catbalogan", "Gandara", "Basey", "Sta. Rita"],
      "Southern Leyte": ["Maasin", "Sogod", "Hinunangan"],
    },
  },
  "Region IX (Zamboanga Peninsula)": {
    provinces: ["Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay", "Others"],
    cities: {
      "Zamboanga del Norte": [
        "Bacungan",
        "Baliguian",
        "Dapitan",
        "Dipolog",
        "Godod",
        "Gutalac",
        "Jose Dalman",
        "Kalawit",
        "Katipunan",
        "La Libertad",
        "Labason",
        "Liloy",
        "Manukan",
        "Mutia",
        "Piñan",
        "Polanco",
        "Pres. Manuel A. Roxas",
        "Rizal",
        "Salug",
        "Sergio Osmeña Sr.",
        "Siayan",
        "Sibuco",
        "Sibutad",
        "Sindangan",
        "Siocon",
        "Sirawai",
        "Tampilisan",
      ],
      "Zamboanga del Sur": [
        "Aurora",
        "Bayog",
        "Dimataling",
        "Dinas",
        "Dumalinao",
        "Dumingag",
        "Guipos",
        "Josefina",
        "Kumalarang",
        "Labangan",
        "Lakewood",
        "Lapuyan",
        "Mahayag",
        "Margosatubig",
        "Midsalip",
        "Molave",
        "Pagadian",
        "Pitogo",
        "Ramon Magsaysay",
        "San Miguel",
        "San Pablo",
        "Sominot",
        "Tabina",
        "Tambulig",
        "Tigbao",
        "Tukuran",
        "Vincenzo Sagun",
      ],
      "Zamboanga Sibugay": [
        "Alicia",
        "Buug",
        "Diplahan",
        "Imelda",
        "Ipil",
        "Kabasalan",
        "Mabuhay",
        "Malangas",
        "Naga",
        "Olutanga",
        "Payao",
        "Roseller Lim",
        "Siay",
        "Talusan",
        "Titay",
        "Tungawan",
      ],
      Others: ["Isabela City", "Zamboanga City"],
    },
  },
  "Region X (Northern Mindanao)": {
    provinces: ["Bukidnon", "Camiguin", "Lanao del Norte", "Misamis Occidental", "Misamis Oriental"],
    cities: {
      Bukidnon: ["Malaybalay", "Valencia"],
      Camiguin: [],
      "Lanao del Norte": ["Iligan"],
      "Misamis Occidental": ["Oroquieta", "Ozamiz", "Tangub"],
      "Misamis Oriental": ["Gingoog", "El Salvador", "Cagayan de Oro"],
    },
  },
  "Region XI (Davao Region)": {
    provinces: ["Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental"],
    cities: {
      "Davao de Oro": [],
      "Davao del Norte": ["Panabo", "Samal", "Tagum"],
      "Davao del Sur": ["Digos"],
      "Davao Occidental": [],
      "Davao Oriental": ["Mati"],
      Others: ["Davao City"],
    },
  },
  "Region XII (SOCCSKSARGEN)": {
    provinces: ["Cotabato", "Sarangani", "South Cotabato", "Sultan Kudarat"],
    cities: {
      Cotabato: ["Kidapawan"],
      Sarangani: [],
      "South Cotabato": ["Koronadal", "General Santos"],
      "Sultan Kudarat": ["Tacurong"],
      Others: ["Cotabato City"],
    },
  },
  "Region XIII (Caraga)": {
    provinces: ["Agusan del Norte", "Agusan del Sur", "Dinagat Islands", "Surigao del Norte", "Surigao del Sur"],
    cities: {
      "Agusan del Norte": ["Cabadbaran"],
      "Agusan del Sur": ["Bayugan"],
      "Dinagat Islands": [],
      "Surigao del Norte": ["Surigao"],
      "Surigao del Sur": ["Bislig", "Tandag"],
      Others: ["Butuan"],
    },
  },
  "National Capital Region (NCR)": {
    provinces: [
      "Metro Manila District I",
      "Metro Manila District II",
      "Metro Manila District III",
      "Metro Manila District IV",
    ],
    cities: {
      "Metro Manila District I": ["Manila"],
      "Metro Manila District II": ["Mandaluyong", "Marikina", "Pasig", "Quezon City", "San Juan"],
      "Metro Manila District III": ["Caloocan", "Malabon", "Navotas", "Valenzuela"],
      "Metro Manila District IV": ["Las Piñas", "Makati", "Muntinlupa", "Parañaque", "Pasay", "Pateros", "Taguig"],
    },
  },
  "Cordillera Administrative Region (CAR)": {
    provinces: ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"],
    cities: {
      Abra: [],
      Apayao: [],
      Benguet: ["Baguio"],
      Ifugao: [],
      Kalinga: ["Tabuk"],
      "Mountain Province": [],
    },
  },
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)": {
    provinces: ["Basilan", "Lanao del Sur", "Maguindanao del Norte", "Maguindanao del Sur", "Sulu", "Tawi-Tawi"],
    cities: {
      Basilan: ["Lamitan"],
      "Lanao del Sur": ["Marawi"],
      "Maguindanao del Norte": ["Cotabato"],
      "Maguindanao del Sur": [],
      Sulu: [],
      "Tawi-Tawi": [],
    },
  },
}

// Add a zipCode mapping for regions, provinces, and cities
// Add this after the locationHierarchy declaration
const zipCodeMapping: {
  [region: string]: {
    default: string
    provinces: {
      [province: string]: {
        default: string
        cities: {
          [city: string]: string
        }
      }
    }
  }
} = {
  "Region I (Ilocos Region)": {
    default: "2900",
    provinces: {
      "Ilocos Norte": {
        default: "2900",
        cities: {
          Laoag: "2900",
          Batac: "2906",
          Paoay: "2910",
          Pagudpud: "2919",
        },
      },
      "Ilocos Sur": {
        default: "2700",
        cities: {
          Vigan: "2700",
          Candon: "2710",
          Bantay: "2727",
          Narvacan: "2704",
        },
      },
      "La Union": {
        default: "2500",
        cities: {
          "San Fernando": "2500",
          Agoo: "2504",
          Bauang: "2501",
        },
      },
      Pangasinan: {
        default: "2400",
        cities: {
          Dagupan: "2400",
          Alaminos: "2404",
          "San Carlos": "2420",
          Urdaneta: "2428",
          Lingayen: "2401",
          Bayambang: "2423",
          Binmaley: "2417",
          Mangaldan: "2432",
          Rosales: "2441",
        },
      },
    },
  },
  // Add default zip codes for other regions
  "National Capital Region (NCR)": {
    default: "1000",
    provinces: {
      "Metro Manila District I": {
        default: "1000",
        cities: {
          Manila: "1000",
        },
      },
      "Metro Manila District II": {
        default: "1550",
        cities: {
          Mandaluyong: "1550",
          Marikina: "1800",
          Pasig: "1600",
          "Quezon City": "1100",
          "San Juan": "1500",
        },
      },
      "Metro Manila District III": {
        default: "1400",
        cities: {
          Caloocan: "1400",
          Malabon: "1470",
          Navotas: "1485",
          Valenzuela: "1440",
        },
      },
      "Metro Manila District IV": {
        default: "1700",
        cities: {
          "Las Piñas": "1740",
          Makati: "1200",
          Muntinlupa: "1780",
          Parañaque: "1700",
          Pasay: "1300",
          Pateros: "1620",
          Taguig: "1630",
        },
      },
    },
  },
  // You can add more regions with their zip codes as needed
}

// Update the form schema to include email
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
    city: z.string().optional(), // Make city optional
    streetAddress: z.string().min(1, "Street address is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
  })
  .refine(
    (data) => {
      const selectedProvince = data.province
      if (selectedProvince && locationHierarchy[data.region]?.cities[selectedProvince]?.length > 0) {
        return !!data.city // Require city if province has cities
      }
      return true // Allow proceeding if the province has no cities
    },
    {
      message: "City is required if the province has cities",
      path: ["city"],
    },
  )

interface PersonalDetailsFormProps {
  initialData: any
  onSubmit: (data: any) => void
}

// Inside your component
export function PersonalDetailsForm({ initialData, onSubmit }: PersonalDetailsFormProps) {
  const auth = getAuth()
  const user = auth.currentUser

  const [availableProvinces, setAvailableProvinces] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [formDataLoaded, setFormDataLoaded] = useState(false)

  // Update the default form data to include email
  const [formData, setFormData] = useLocalStorage(
    "personalDetailsForm",
    initialData || {
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      region: "",
      province: "",
      city: "",
      streetAddress: "",
      zipCode: "",
    },
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
  })

  // Get the current values
  const currentRegion = form.watch("region")
  const currentProvince = form.watch("province")

  // Update provinces when region changes
  // Update the useEffect for region changes to also update the zip code
  useEffect(() => {
    if (currentRegion && currentRegion in locationHierarchy) {
      const provinces = locationHierarchy[currentRegion].provinces
      setAvailableProvinces([...provinces].sort())

      // Only clear province and city if we're not in the initial loading phase
      if (formDataLoaded && !initialData?.region) {
        form.setValue("province", "")
        form.setValue("city", "")

        // Set default zip code for the region
        if (zipCodeMapping[currentRegion]) {
          form.setValue("zipCode", zipCodeMapping[currentRegion].default)
        }
      }
    }
  }, [currentRegion, form, formDataLoaded, initialData])

  // Update the useEffect for province changes to also update the zip code
  useEffect(() => {
    if (
      currentRegion &&
      currentProvince &&
      currentRegion in locationHierarchy &&
      currentProvince in locationHierarchy[currentRegion].cities
    ) {
      const cities = locationHierarchy[currentRegion].cities[currentProvince]
      setAvailableCities([...cities].sort())

      // Only clear city if we're not in the initial loading phase
      if (formDataLoaded && !initialData?.province) {
        form.setValue("city", "")

        // Set default zip code for the province
        if (zipCodeMapping[currentRegion]?.provinces[currentProvince]) {
          form.setValue("zipCode", zipCodeMapping[currentRegion].provinces[currentProvince].default)
        }
      }
    }
  }, [currentProvince, currentRegion, form, formDataLoaded, initialData])

  // Add a new useEffect for city changes to update the zip code
  useEffect(() => {
    const currentCity = form.watch("city")

    if (
      currentRegion &&
      currentProvince &&
      currentCity &&
      zipCodeMapping[currentRegion]?.provinces[currentProvince]?.cities[currentCity]
    ) {
      // Set specific zip code for the city
      form.setValue("zipCode", zipCodeMapping[currentRegion].provinces[currentProvince].cities[currentCity])
    }
  }, [form.watch("city"), currentRegion, currentProvince, form])

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const subscription = form.watch((formValues) => {
      if (formDataLoaded && formValues) {
        setFormData(formValues)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, formDataLoaded, setFormData])

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const subscription = form.watch((formValues) => {
      if (formDataLoaded && formValues) {
        localStorage.setItem("personalDetailsForm", JSON.stringify(formValues))
      }
    })

    return () => subscription.unsubscribe()
  }, [form, formDataLoaded])

  // Update the fetchUserData function to include email
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()

            // Check if we already have form data in localStorage
            const savedFormData = localStorage.getItem("personalDetailsForm")
            if (!savedFormData) {
              // Set form values from Firebase data if no localStorage data exists
              const formData = {
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                gender: userData.gender || "",
                email: userData.email || "",
                phoneNumber: userData.phoneNumber || "",
                dateOfBirth: userData.dateOfBirth || "",
                region: userData.region || "",
                province: userData.province || "",
                city: userData.city || "",
                streetAddress: userData.streetAddress || "",
                zipCode: userData.zipCode || "",
              }

              form.reset(formData)
              setFormData(formData)
            }

            // Populate available provinces based on the retrieved region
            if (userData.region && userData.region in locationHierarchy) {
              setAvailableProvinces([...locationHierarchy[userData.region].provinces].sort())
            }

            // Populate available cities based on the retrieved province
            if (
              userData.region &&
              userData.province &&
              userData.region in locationHierarchy &&
              userData.province in locationHierarchy[userData.region].cities
            ) {
              setAvailableCities([...locationHierarchy[userData.region].cities[userData.province]].sort())
            }
          }

          // Mark form as loaded after data retrieval
          setFormDataLoaded(true)
        } catch (error) {
          console.error("Error fetching user data:", error)
          setFormDataLoaded(true)
        }
      }

      fetchUserData()
    } else {
      setFormDataLoaded(true)
    }
  }, [user, form, setFormData])
  npm
// Inside the PersonalDetailsForm component
useEffect(() => {
  // This helps prevent hydration errors caused by browser extensions like Grammarly
  // that add attributes to the body element
  if (typeof window !== 'undefined') {
    const observer = new MutationObserver(() => {
      // This empty observer just acknowledges the mutations without doing anything
      // which helps React reconcile the differences
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed']
    });
    
    return () => observer.disconnect();
  }
}, []);
  // Prevent form submission if data hasn't been loaded yet
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    if (formDataLoaded) {
      // Save form data to localStorage before submitting
      setFormData(data)
      onSubmit(data)
    }
  }

  // Function to reset the form
  // Update the reset function to include email
  const handleReset = () => {
    // Explicitly reset specific fields
    form.setValue("firstName", "")
    form.setValue("lastName", "")
    form.setValue("gender", "")
    form.setValue("email", "")
    form.setValue("phoneNumber", "")
    form.setValue("dateOfBirth", "")
    form.setValue("streetAddress", "")
    form.setValue("region", "")
    form.setValue("province", "")
    form.setValue("city", "")
    form.setValue("zipCode", "")

    // Clear localStorage
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      streetAddress: "",
      region: "",
      province: "",
      city: "",
      zipCode: "",
    })
  }

  // Replace the form JSX with the updated structure
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="First Name" className="bg-white/50" {...field} disabled />
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
                  <Input placeholder="Last Name" className="bg-white/50" {...field} disabled />
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
                <Select onValueChange={field.onChange} value={field.value} disabled>
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="email" placeholder="Email Address" className="bg-white/50" {...field} disabled />
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
                <Input type="date" placeholder="Date of Birth" className="bg-white/50" {...field} disabled />
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
                      <SelectValue placeholder="City/Municipality" />
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

        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="ZIP Code"
                  className="bg-white/50"
                  {...field}
                  disabled={true} // Make it read-only since it's automatically set
                />
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
