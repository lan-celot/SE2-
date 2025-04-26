// @/components/customer-components/dashboard/book/addresshierachybank.js

export const philippineRegions = [
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

export const locationHierarchy = {
  "Region I (Ilocos Region)": {
    provinces: ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
    locations: {
      "Ilocos Norte": {
        cities: ["Laoag", "Batac"],
        municipalities: [
          "Adams", "Bacarra", "Badoc", "Bangui", "Banna", "Burgos", "Carasi", "Currimao",
          "Dingras", "Dumalneg", "Marcos", "Nueva Era", "Paoay", "Pagudpud", "Pinili",
          "San Nicolas", "Sarrat", "Solsona", "Vintar"
        ]
      },
      "Ilocos Sur": {
        cities: ["Vigan", "Candon"],
        municipalities: [
          "Alilem", "Banayoyo", "Bantay", "Burgos", "Cabugao", "Caoayan", "Cervantes",
          "Galimuyod", "Gregorio del Pilar", "Lidlidda", "Magsingal", "Nagbukel",
          "Narvacan", "Quirino", "Salcedo", "San Emilio", "San Esteban", "San Ildefonso",
          "San Juan", "San Vicente", "Santa", "Santa Catalina", "Santa Cruz",
          "Santa Lucia", "Santa Maria", "Santiago", "Santo Domingo", "Sigay",
          "Sinait", "Sugpon", "Suyo", "Tagudin"
        ]
      },
      "La Union": {
        cities: ["San Fernando"],
        municipalities: [
          "Agoo", "Aringay", "Bacnotan", "Bagulin", "Balaoan", "Bangar", "Bauang", "Burgos",
          "Caba", "Luna", "Naguilian", "Pugo", "Rosario", "San Gabriel", "San Juan",
          "Santo Tomas", "Santol", "Sudipen", "Tubao"
        ]
      },
      "Pangasinan": {
        cities: ["Alaminos", "Dagupan", "San Carlos", "Urdaneta", "Binmaley", "San Fabian", "San Jacinto", "Sual", "Tayug"],
        municipalities: [
          "Agno", "Aguilar", "Alcala", "Anda", "Asingan", "Balungao", "Bani", "Basista",
          "Bautista", "Bayambang", "Binalonan", "Bolinao", "Bugallon", "Burgos",
          "Calasiao", "Dasol", "Infanta", "Labrador", "Laoac", "Lingayen", "Mabini",
          "Malasiqui", "Manaoag", "Mangaldan", "Mangatarem", "Mapandan", "Natividad",
          "Pozorrubio", "Rosales", "San Manuel", "San Nicolas", "San Quintin",
          "Santa Barbara", "Santa Maria", "Santo Tomas", "Sison", "Umingan",
          "Urbiztondo", "Villasis"
        ]
      }
    }
  },
  "Region II (Cagayan Valley)": {
    provinces: ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
    locations: {
      "Batanes": {
        cities: ["Basco"],
        municipalities: ["Itbayat", "Ivana", "Mahatao", "Sabtang", "Uyugan"]
      },
      "Cagayan": {
        cities: ["Tuguegarao", "Aparri", "Sanchez Mira", "Lasam"],
        municipalities: [
          "Abulug", "Baggao", "Ballesteros", "Buguey", "Calayan", "Camalaniugan",
          "Enrile", "Gonzaga", "Lal-lo", "Piat", "Rizal", "Santa Ana",
          "Santa Praxedes", "Santo Niño", "Solana", "Tuao", "Amulung", "Claveria",
          "Gattaran", "Iguig", "Pamplona", "Peñablanca", "Santa Teresita"
        ]
      },
      "Isabela": {
        cities: ["Ilagan", "Santiago", "Cauayan"],
        municipalities: [
          "Alicia", "Angadanan", "Aurora", "Benito Soliven", "Cordon", "Dinapigue",
          "Divilacan", "Echague", "Gamu", "Jones", "Luna", "Maconacon", "Mallig",
          "San Agustin", "San Guillermo", "San Isidro", "San Manuel", "San Mateo",
          "San Pablo", "San Mariano", "San Nicolas", "Tumauini", "Cabagan",
          "Delfin Albano", "Naguilian", "Palanan", "Quezon", "Reina Mercedes",
          "Ramon", "Roxas"
        ]
      },
      "Nueva Vizcaya": {
        cities: ["Bayombong"],
        municipalities: [
          "Aritao", "Bagabag", "Bambang", "Dupax del Norte", "Dupax del Sur",
          "Kasibu", "Kayapa", "Quezon", "Solano", "Villaverde"
        ]
      },
      "Quirino": {
        cities: [],
        municipalities: ["Cabarroguis", "Diffun", "Maddela", "Nagtipunan", "Saguday"]
      }
    }
  },
  "Region III (Central Luzon)": {
    provinces: ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"],
    locations: {
      "Aurora": {
        cities: [],
        municipalities: [
          "Baler", "Casiguran", "Dilasag", "Dinalungan", "Dingalan",
          "Dipaculao", "Maria Aurora", "San Luis"
        ]
      },
      "Bataan": {
        cities: ["Balanga City"],
        municipalities: [
          "Abucay", "Bagac", "Dinalupihan", "Hermosa", "Limay",
          "Mariveles", "Morong", "Orani", "Orion", "Pilar", "Samal"
        ]
      },
      "Bulacan": {
        cities: [
          "Malolos City", "Meycauayan City", "San Jose del Monte City", "Baliwag City"
        ],
        municipalities: [
          "Angat", "Balagtas", "Bocaue", "Bulacan", "Bustos", "Calumpit",
          "Doña Remedios Trinidad", "Guiguinto", "Hagonoy", "Marilao", "Norzagaray",
          "Obando", "Pandi", "Paombong", "Plaridel", "Pulilan", "San Ildefonso",
          "San Miguel", "San Rafael", "Santa Maria"
        ]
      },
      "Nueva Ecija": {
        cities: [
          "Cabanatuan City", "Gapan City", "Muñoz City", "Palayan City", "San Jose City"
        ],
        municipalities: [
          "Aliaga", "Bongabon", "Cabiao", "Carranglan", "Cuyapo", "Gabaldon",
          "General Mamerto Natividad", "General Tinio", "Guimba", "Jaen", "Laur",
          "Licab", "Llanera", "Lupao", "Nampicuan", "Pantabangan", "Peñaranda",
          "Quezon", "Rizal", "San Antonio", "San Isidro", "San Leonardo",
          "Santa Rosa", "Santo Domingo", "Talavera", "Talugtug", "Zaragoza"
        ]
      },
      "Pampanga": {
        cities: ["Angeles City", "San Fernando City", "Mabalacat City"],
        municipalities: [
          "Apalit", "Arayat", "Bacolor", "Candaba", "Floridablanca", "Guagua",
          "Lubao", "Macabebe", "Magalang", "Masantol", "Mexico", "Minalin",
          "Porac", "San Luis", "San Simon", "Santa Ana", "Santa Rita", "Santo Tomas"
        ]
      },
      "Tarlac": {
        cities: ["Tarlac City"],
        municipalities: [
          "Anao", "Bamban", "Camiling", "Capas", "Concepcion", "Gerona",
          "La Paz", "Mayantoc", "Moncada", "Paniqui", "Pura", "Ramos",
          "San Clemente", "San Jose", "San Manuel", "Santa Ignacia", "Victoria"
        ]
      },
      "Zambales": {
        cities: ["Olongapo City"],
        municipalities: [
          "Botolan", "Cabangan", "Candelaria", "Castillejos", "Iba", "Masinloc",
          "Palauig", "San Antonio", "San Felipe", "San Marcelino", "San Narciso",
          "Santa Cruz", "Subic"
        ]
      }
    }
  }
};

export const zipCodeMapping = {
  "Region I (Ilocos Region)": {
    default: "2900",
    provinces: {
      "Ilocos Norte": {
        default: "2900",
        cities: {
          "Laoag": "2900",
          "Batac": "2906"
        },
        municipalities: {
          "Adams": "2922", "Bacarra": "2916", "Badoc": "2904", "Bangui": "2920",
          "Banna": "2908", "Burgos": "2918", "Carasi": "2911", "Currimao": "2903",
          "Dingras": "2913", "Dumalneg": "2021", "Marcos": "2907", "Nueva Era": "2912",
          "Paoay": "2910", "Pagudpud": "2919", "Pinili": "2905", "San Nicolas": "2901",
          "Sarrat": "2914", "Solsona": "2909", "Vintar": "2915"
        }
      },
      "Ilocos Sur": {
        default: "2700",
        cities: {
          "Vigan": "2700",
          "Candon": "2710"
        },
        municipalities: {
          "Alilem": "2725", "Banayoyo": "2726", "Bantay": "2727", "Burgos": "2728",
          "Cabugao": "2705", "Caoayan": "2706", "Cervantes": "2724", "Galimuyod": "2723",
          "Gregorio del Pilar": "2722", "Lidlidda": "2721", "Magsingal": "2703",
          "Nagbukel": "2702", "Narvacan": "2704", "Quirino": "2709", "Salcedo": "2708",
          "San Emilio": "2707", "San Esteban": "2711", "San Ildefonso": "2712",
          "San Juan": "2713", "San Vicente": "2714", "Santa": "2715",
          "Santa Catalina": "2716", "Santa Cruz": "2717", "Santa Lucia": "2718",
          "Santa Maria": "2719", "Santiago": "2720", "Santo Domingo": "2729",
          "Sigay": "2730", "Sinait": "2731", "Sugpon": "2732", "Suyo": "2733",
          "Tagudin": "2734"
        }
      },
      "La Union": {
        default: "2500",
        cities: {
          "San Fernando": "2500"
        },
        municipalities: {
          "Agoo": "2504", "Aringay": "2502", "Bacnotan": "2503", "Bagulin": "2505",
          "Balaoan": "2506", "Bangar": "2507", "Bauang": "2501", "Burgos": "2508",
          "Caba": "2509", "Luna": "2510", "Naguilian": "2511", "Pugo": "2512",
          "Rosario": "2513", "San Gabriel": "2514", "San Juan": "2515",
          "Santo Tomas": "2516", "Santol": "2517", "Sudipen": "2518", "Tubao": "2519"
        }
      },
      "Pangasinan": {
        default: "2400",
        cities: {
          "Alaminos": "2404", "Dagupan": "2400", "San Carlos": "2420", "Urdaneta": "2428",
          "Binmaley": "2417", "San Fabian": "2431", "San Jacinto": "2433",
          "Sual": "2442", "Tayug": "2443"
        },
        municipalities: {
          "Agno": "2402", "Aguilar": "2403", "Alcala": "2405", "Anda": "2406",
          "Asingan": "2407", "Balungao": "2408", "Bani": "2409", "Basista": "2410",
          "Bautista": "2411", "Bayambang": "2423", "Binalonan": "2432", "Bolinao": "2416",
          "Bugallon": "2412", "Burgos": "2413", "Calasiao": "2414", "Dasol": "2415",
          "Infanta": "2416", "Labrador": "2418", "Laoac": "2419", "Lingayen": "2401",
          "Mabini": "2421", "Malasiqui": "2422", "Manaoag": "2424", "Mangaldan": "2432",
          "Mangatarem": "2426", "Mapandan": "2427", "Natividad": "2429",
          "Pozorrubio": "2430", "Rosales": "2441", "San Manuel": "2434",
          "San Nicolas": "2435", "San Quintin": "2436", "Santa Barbara": "2437",
          "Santa Maria": "2438", "Santo Tomas": "2439", "Sison": "2440",
          "Umingan": "2444", "Urbiztondo": "2445", "Villasis": "2446"
        }
      }
    }
  },
  "Region II (Cagayan Valley)": {
    default: "3500",
    provinces: {
      "Batanes": {
        default: "3900",
        cities: {
          "Basco": "3900"
        },
        municipalities: {
          "Itbayat": "3901", "Ivana": "3902", "Mahatao": "3903", "Sabtang": "3904", "Uyugan": "3905"
        }
      },
      "Cagayan": {
        default: "3500",
        cities: {
          "Tuguegarao": "3500",
          "Aparri": "3515",
          "Sanchez Mira": "3519",
          "Lasam": "3514"
        },
        municipalities: {
          "Abulug": "3505", "Baggao": "3506", "Ballesteros": "3507", "Buguey": "3508",
          "Calayan": "3901", "Camalaniugan": "3510", "Cenon": "3511", "Enrile": "3512",
          "Gonzaga": "3513", "Lasam": "3514", "Lal-lo": "3516", "Piat": "3517",
          "Rizal": "3518", "Santa Ana": "3520", "Santa Praxedes": "3521", "Santo Niño": "3522",
          "Solana": "3523", "Tuao": "3524", "Umuya": "3525", "Villaverde": "3526",
          "Amulung": "3527", "Claveria": "3528", "Gattaran": "3529", "Iguig": "3530",
          "Pamplona": "3531", "Peñablanca": "3532", "Santa Teresita": "3533"
        }
      },
      "Isabela": {
        default: "3300",
        cities: {
          "Ilagan": "3300",
          "Santiago": "3311"
        },
        municipalities: {
          "Alicia": "3310", "Angadanan": "3312", "Aurora": "3313", "Benito Soliven": "3314",
          "Cauayan": "3315", "Cordon": "3316", "Dinapigue": "3317", "Divilacan": "3318",
          "Echague": "3319", "Gamu": "3320", "Jones": "3321", "Luna": "3322",
          "Maconacon": "3323", "Mallig": "3324", "San Agustin": "3325", "San Guillermo": "3326",
          "San Isidro": "3327", "San Manuel": "3328", "San Mateo": "3329", "San Pablo": "3330",
          "San Mariano": "3331", "San Nicolas": "3332", "Tumauini": "3333", "Cabagan": "3334",
          "Delfin Albano": "3335", "Naguilian": "3336", "Palanan": "3337", "Quezon": "3338",
          "Reina Mercedes": "3339", "Ramon": "3340", "Roxas": "3341"
        }
      },
      "Nueva Vizcaya": {
        default: "3700",
        cities: {
          "Bayombong": "3700"
        },
        municipalities: {
          "Aritao": "3701", "Bagabag": "3702", "Bambang": "3703", "Dupax del Norte": "3704",
          "Dupax del Sur": "3705", "Kasibu": "3706", "Kayapa": "3707", "Quezon": "3708",
          "Solano": "3709", "Villaverde": "3710"
        }
      },
      "Quirino": {
        default: "3400",
        cities: {},
        municipalities: {
          "Cabarroguis": "3401", "Diffun": "3402", "Maddela": "3403", "Nagtipunan": "3404", "Saguday": "3405"
        }
      }
    }
  },
  "Region III (Central Luzon)": {
    default: "2000",
    provinces: {
      "Aurora": {
        default: "3200",
        cities: {},
        municipalities: {
          "Baler": "3200",
          "Casiguran": "3204",
          "Dilasag": "3205",
          "Dinalungan": "3206",
          "Dingalan": "3207",
          "Dipaculao": "3203",
          "Maria Aurora": "3202",
          "San Luis": "3201"
        }
      },
      "Bataan": {
        default: "2100",
        cities: {
          "Balanga City": "2100"
        },
        municipalities: {
          "Abucay": "2114",
          "Bagac": "2107",
          "Dinalupihan": "2110",
          "Hermosa": "2111",
          "Limay": "2103",
          "Mariveles": "2105",
          "Morong": "2108",
          "Orani": "2112",
          "Orion": "2102",
          "Pilar": "2101",
          "Samal": "2113"
        }
      },
      "Bulacan": {
        default: "3000",
        cities: {
          "Malolos City": "3000",
          "Meycauayan City": "3020",
          "San Jose del Monte City": "3023",
          "Baliwag City": "3006"
        },
        municipalities: {
          "Angat": "3012",
          "Balagtas": "3016",
          "Bocaue": "3018",
          "Bulacan": "3017",
          "Bustos": "3007",
          "Calumpit": "3003",
          "Doña Remedios Trinidad": "3009",
          "Guiguinto": "3015",
          "Hagonoy": "3002",
          "Marilao": "3019",
          "Norzagaray": "3013",
          "Obando": "3021",
          "Pandi": "3014",
          "Paombong": "3001",
          "Plaridel": "3004",
          "Pulilan": "3005",
          "San Ildefonso": "3010",
          "San Miguel": "3011",
          "San Rafael": "3008",
          "Santa Maria": "3022"
        }
      },
      "Nueva Ecija": {
        default: "3100",
        cities: {
          "Cabanatuan City": "3100",
          "Gapan City": "3105",
          "Muñoz City": "3119",
          "Palayan City": "3132",
          "San Jose City": "3121"
        },
        municipalities: {
          "Aliaga": "3111",
          "Bongabon": "3128",
          "Cabiao": "3107",
          "Carranglan": "3123",
          "Cuyapo": "3117",
          "Gabaldon": "3131",
          "General Mamerto Natividad": "3125",
          "General Tinio": "3104",
          "Guimba": "3115",
          "Jaen": "3109",
          "Laur": "3129",
          "Licab": "3112",
          "Llanera": "3126",
          "Lupao": "3122",
          "Nampicuan": "3116",
          "Pantabangan": "3124",
          "Peñaranda": "3103",
          "Quezon": "3113",
          "Rizal": "3127",
          "San Antonio": "3108",
          "San Isidro": "3106",
          "San Leonardo": "3102",
          "Santa Rosa": "3101",
          "Santo Domingo": "3133",
          "Talavera": "3114",
          "Talugtug": "3118",
          "Zaragoza": "3110"
        }
      },
      "Pampanga": {
        default: "2000",
        cities: {
          "Angeles City": "2009",
          "San Fernando City": "2000",
          "Mabalacat City": "2010"
        },
        municipalities: {
          "Apalit": "2016",
          "Arayat": "2012",
          "Bacolor": "2001",
          "Candaba": "2013",
          "Floridablanca": "2006",
          "Guagua": "2003",
          "Lubao": "2005",
          "Macabebe": "2018",
          "Magalang": "2011",
          "Masantol": "2017",
          "Mexico": "2021",
          "Minalin": "2019",
          "Porac": "2008",
          "San Luis": "2014",
          "San Simon": "2015",
          "Santa Ana": "2022",
          "Santa Rita": "2002",
          "Santo Tomas": "2020"
        }
      },
      "Tarlac": {
        default: "2300",
        cities: {
          "Tarlac City": "2300"
        },
        municipalities: {
          "Anao": "2310",
          "Bamban": "2317",
          "Camiling": "2306",
          "Capas": "2315",
          "Concepcion": "2316",
          "Gerona": "2302",
          "La Paz": "2314",
          "Mayantoc": "2304",
          "Moncada": "2314",
          "Paniqui": "2307",
          "Pura": "2312",
          "Ramos": "2311",
          "San Clemente": "2301",
          "San Jose": "2305",
          "San Manuel": "2309",
          "Santa Ignacia": "2303",
          "Victoria": "2313"
        }
      },
      "Zambales": {
        default: "2200",
        cities: {
          "Olongapo City": ""
        },
        municipalities: {
          "Botolan": "2202",
          "Cabangan": "2203",
          "Candelaria": "2212",
          "Castillejos": "2208",
          "Iba": "2201",
          "Masinloc": "2211",
          "Palauig": "2210",
          "San Antonio": "2206",
          "San Felipe": "2204",
          "San Marcelino": "2207",
          "San Narciso": "2205",
          "Santa Cruz": "2213",
          "Subic": "2209"
        }
      }
    }
  }
};