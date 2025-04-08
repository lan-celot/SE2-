/*

// Philippine region data
const philippineRegions = ["Region I (Ilocos Region)"].sort();

// Hierarchical location data
const locationHierarchy: LocationHierarchy = {
  "Region I (Ilocos Region)": {
    provinces: ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
    locations: {
      "Ilocos Norte": {
        cities: ["Laoag", "Batac"],
        municipalities: [
          "Adams", "Bacarra", "Badoc", "Bangui", "Banna", "Burgos", "Carasi",
          "Currimao", "Dingras", "Dumalneg", "Marcos", "Nueva Era", "Pagudpud",
          "Paoay", "Pasuquin", "Piddig", "Pinili", "San Nicolas", "Sarrat",
          "Solsona", "Vintar"
        ]
      },
      "Ilocos Sur": {
        cities: ["Vigan", "Candon"],
        municipalities: [
          "Alilem", "Banayoyo", "Bantay", "Burgos", "Cabugao", "Caoayan",
          "Cervantes", "Galimuyod", "Gregorio del Pilar", "Lidlidda", "Magsingal",
          "Nagbukel", "Narvacan", "Quirino", "Salcedo", "San Emilio", "San Esteban",
          "San Ildefonso", "San Juan", "San Vicente", "Santa", "Santa Catalina",
          "Santa Cruz", "Santa Lucia", "Santa Maria", "Santiago", "Santo Domingo",
          "Sigay", "Sinait", "Sugpon", "Suyo", "Tagudin"
        ]
      },
      "La Union": {
        cities: ["San Fernando"],
        municipalities: [
          "Agoo", "Aringay", "Bacnotan", "Bagulin", "Balaoan", "Bangar", "Bauang",
          "Burgos", "Caba", "Luna", "Naguilian", "Pugo", "Rosario", "San Gabriel",
          "San Juan", "Santol", "Santo Tomas", "Sudipen", "Tubao"
        ]
      },
      "Pangasinan": {
        cities: ["Dagupan", "Alaminos", "San Carlos", "Urdaneta"],
        municipalities: [
          "Agno", "Aguilar", "Alcala", "Anda", "Asingan", "Balungao", "Bani",
          "Basista", "Bautista", "Bayambang", "Binalonan", "Binmaley", "Bolinao",
          "Bugallon", "Burgos", "Calasiao", "Dasol", "Infanta", "Labrador", "Laoac",
          "Lingayen", "Mabini", "Malasiqui", "Manaoag", "Mangaldan", "Mangatarem",
          "Mapandan", "Natividad", "Pozorrubio", "Rosales", "San Fabian", "San Jacinto",
          "San Manuel", "San Nicolas", "San Quintin", "Santa Barbara", "Santa Maria",
          "Santo Tomas", "Sison", "Sual", "Tayug", "Umingan", "Urbiztondo", "Villasis"
        ]
      }
    }
  }
};

// Define type for ZIP code mapping structure
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
        cities: {
          "Laoag": "2900",
          "Batac": "2906"
        },
        municipalities: {
          "Adams": "2922",
          "Bacarra": "2916",
          "Badoc": "2904",
          "Bangui": "2920",
          "Banna": "2908",
          "Burgos": "2918",
          "Carasi": "2911",
          "Currimao": "2903",
          "Dingras": "2913",
          "Dumalneg": "2921",
          "Marcos": "2907",
          "Nueva Era": "2909",
          "Pagudpud": "2919",
          "Paoay": "2902",
          "Pasuquin": "2917",
          "Piddig": "2912",
          "Pinili": "2905",
          "San Nicolas": "2901",
          "Sarrat": "2914",
          "Solsona": "2910",
          "Vintar": "2915"
        }
      },
      "Ilocos Sur": {
        default: "2700",
        cities: {
          "Vigan": "2700",
          "Candon": "2710"
        },
        municipalities: {
          "Alilem": "2716",
          "Banayoyo": "2708",
          "Bantay": "2727",
          "Burgos": "2724",
          "Cabugao": "2732",
          "Caoayan": "2702",
          "Cervantes": "2718",
          "Galimuyod": "2709",
          "Gregorio del Pilar": "2720",
          "Lidlidda": "2723",
          "Magsingal": "2730",
          "Nagbukel": "2725",
          "Narvacan": "2704",
          "Quirino": "2721",
          "Salcedo": "2711",
          "San Emilio": "2722",
          "San Esteban": "2706",
          "San Ildefonso": "2728",
          "San Juan": "2731",
          "San Vicente": "2726",
          "Santa": "2703",
          "Santa Catalina": "2701",
          "Santa Cruz": "2713",
          "Santa Lucia": "2712",
          "Santa Maria": "2705",
          "Santiago": "2707",
          "Santo Domingo": "2729",
          "Sigay": "2719",
          "Sinait": "2733",
          "Sugpon": "2717",
          "Suyo": "2715",
          "Tagudin": "2714"
        }
      },
      "La Union": {
        default: "2500",
        cities: {
          "San Fernando": "2500"
        },
        municipalities: {
          "Agoo": "2504",
          "Aringay": "2503",
          "Bacnotan": "2515",
          "Bagulin": "2512",
          "Balaoan": "2517",
          "Bangar": "2519",
          "Bauang": "2501",
          "Burgos": "2510",
          "Caba": "2502",
          "Luna": "2518",
          "Naguilian": "2511",
          "Pugo": "2508",
          "Rosario": "2506",
          "San Gabriel": "2513",
          "San Juan": "2514",
          "Santol": "2516",
          "Santo Tomas": "2505",
          "Sudipen": "2520",
          "Tubao": "2509"
        }
      },
      "Pangasinan": {
        default: "2400",
        cities: {
          "Dagupan": "2400",
          "Alaminos": "2404",
          "San Carlos": "2420",
          "Urdaneta": "2428"
        },
        municipalities: {
          "Agno": "2408",
          "Aguilar": "2415",
          "Alcala": "2425",
          "Anda": "2405",
          "Asingan": "2439",
          "Balungao": "2442",
          "Bani": "2407",
          "Basista": "2422",
          "Bautista": "2424",
          "Bayambang": "2423",
          "Binalonan": "2436",
          "Binmaley": "2417",
          "Bolinao": "2406",
          "Bugallon": "2416",
          "Burgos": "2410",
          "Calasiao": "2418",
          "Dasol": "2411",
          "Infanta": "2412",
          "Labrador": "2402",
          "Laoac": "2437",
          "Lingayen": "2401",
          "Mabini": "2409",
          "Malasiqui": "2421",
          "Manaoag": "2438",
          "Mangaldan": "2432",
          "Mangatarem": "2413",
          "Mapandan": "2429",
          "Natividad": "2446",
          "Pozorrubio": "2435",
          "Rosales": "2441",
          "San Fabian": "2433",
          "San Jacinto": "2431",
          "San Manuel": "2430",
          "San Nicolas": "2447",
          "San Quintin": "2444",
          "Santa Barbara": "2419",
          "Santa Maria": "2440",
          "Santo Tomas": "2426",
          "Sison": "2434",
          "Sual": "2403",
          "Tayug": "2445",
          "Umingan": "2443",
          "Urbiztondo": "2428",
          "Villasis": "2427"
        }
      }
    }
  }
};

       

 



*/