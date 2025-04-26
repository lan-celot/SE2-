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
      cities: ["Balanga"],
      municipalities: [
        "Abucay", "Bagac", "Dinalupihan", "Hermosa", "Limay",
        "Mariveles", "Morong", "Orani", "Orion", "Pilar", "Samal"
      ]
    },
    "Bulacan": {
      cities: ["Malolos", "Meycauayan", "San Jose del Monte"],
      municipalities: [
        "Angat", "Balagtas", "Baliwag", "Bocaue", "Bulakan", "Calumpit",
        "Doña Remedios Trinidad", "Guiguinto", "Hagonoy", "Marilao",
        "Norzagaray", "Obando", "Pandi", "Paombong", "Plaridel", "Pulilan",
        "San Ildefonso", "San Miguel", "San Rafael", "Santa Maria"
      ]
    },
    "Nueva Ecija": {
      cities: ["Cabanatuan", "Gapan", "Palayan", "San Jose"],
      municipalities: [
        "Aliaga", "Bongabon", "Cabiao", "Cuyapo", "Gabaldon", "General Mamerto Natividad",
        "General Tinio", "Guimba", "Jaen", "Laur", "Licab", "Llanera", "Lupao", "Nampicuan",
        "Pantabangan", "Peñaranda", "Quezon", "Rizal", "San Antonio", "San Isidro", 
        "San Leonardo", "Santa Rosa", "Santo Domingo", "Talavera", "Talugtug", "Zaragoza"
      ]
    },
    "Pampanga": {
      cities: ["Angeles", "San Fernando", "Mabalacat"],
      municipalities: [
        "Apalit", "Arayat", "Bacolor", "Candaba", "Floridablanca", "Guagua",
        "Lubao", "Masantol", "Mexico", "Minalin", "Porac", "San Luis",
        "San Simon", "Santa Ana", "Santa Rita", "Santo Tomas", "Sasmuan"
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
      cities: ["Olongapo"],
      municipalities: [
        "Botolan", "Cabangan", "Candelaria", "Castillejos", "Iba",
        "Masinloc", "Palauig", "San Antonio", "San Felipe", "San Marcelino",
        "San Narciso", "Santa Cruz", "Subic"
      ]
    }
  }
},
"Region IV-A (CALABARZON)": {
  provinces: ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"],
  locations: {
    "Batangas": {
      cities: ["Batangas City", "Lipa", "Tanauan"],
      municipalities: [
        "Agoncillo", "Alitagtag", "Balayan", "Balete", "Bauan", "Calaca", "Calatagan",
        "Cuenca", "Ibaan", "Laurel", "Lemery", "Lian", "Lobo", "Mabini", "Malvar",
        "Mataasnakahoy", "Nasugbu", "Padre Garcia", "Rosario", "San Jose", "San Juan",
        "San Luis", "San Nicolas", "San Pascual", "Santa Teresita", "Santo Tomas",
        "Taal", "Talisay", "Taysan", "Tingloy", "Tuy"
      ]
    },
    "Cavite": {
      cities: ["Bacoor", "Dasmariñas", "Imus", "Tagaytay", "Trece Martires"],
      municipalities: [
        "Alfonso", "Amadeo", "Carmona", "General Emilio Aguinaldo", "General Mariano Alvarez",
        "General Trias", "Indang", "Kawit", "Magallanes", "Maragondon", "Mendez", "Naic",
        "Noveleta", "Rosario", "Silang", "Tanza", "Ternate"
      ]
    },
    "Laguna": {
      cities: ["Biñan", "Cabuyao", "Calamba", "San Pablo", "Santa Rosa"],
      municipalities: [
        "Alaminos", "Bay", "Calauan", "Famy", "Kalayaan", "Liliw", "Los Baños",
        "Luisiana", "Lumban", "Mabitac", "Magdalena", "Majayjay", "Nagcarlan",
        "Paete", "Pagsanjan", "Pakil", "Pangil", "Pila", "Rizal", "San Pedro",
        "Santa Cruz", "Santa Maria", "Siniloan", "Victoria"
      ]
    },
    "Quezon": {
      cities: ["Lucena"], // Highly urbanized city
      municipalities: [
        "Agdangan", "Alabat", "Atimonan", "Buenavista", "Burdeos", "Calauag",
        "Candelaria", "Catanauan", "Dolores", "General Luna", "General Nakar",
        "Guinayangan", "Gumaca", "Infanta", "Jomalig", "Lopez", "Lucban",
        "Macalelon", "Mauban", "Mulanay", "Padre Burgos", "Pagbilao", "Panukulan",
        "Patnanungan", "Perez", "Pitogo", "Plaridel", "Polillo", "Quezon", "Real",
        "Sampaloc", "San Andres", "San Antonio", "San Francisco", "San Narciso",
        "Sariaya", "Tagkawayan", "Tayabas", "Tiaong", "Unisan"
      ]
    },
    "Rizal": {
      cities: ["Antipolo"],
      municipalities: [
        "Angono", "Baras", "Binangonan", "Cainta", "Cardona", "Jala-jala", "Morong",
        "Pililla", "Rodriguez", "San Mateo", "Tanay", "Taytay", "Teresa"
      ]
    }
  }
},
  "Region IV-B (MIMAROPA)": {
  provinces: ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"],
  locations: {
    "Marinduque": {
      cities: [],
      municipalities: ["Boac", "Buenavista", "Gasan", "Mogpog", "Santa Cruz", "Torrijos"]
    },
    "Occidental Mindoro": {
      cities: [],
      municipalities: [
        "Abra de Ilog", "Calintaan", "Looc", "Lubang", "Magsaysay", "Mamburao",
        "Paluan", "Rizal", "Sablayan", "San Jose", "Santa Cruz"
      ]
    },
    "Oriental Mindoro": {
      cities: ["Calapan"],
      municipalities: [
        "Baco", "Bansud", "Bongabong", "Bulalacao", "Gloria", "Mansalay",
        "Naujan", "Pinamalayan", "Pola", "Puerto Galera", "Roxas",
        "San Teodoro", "Socorro", "Victoria"
      ]
    },
    "Palawan": {
      cities: ["Puerto Princesa"],
      municipalities: [
        "Aborlan", "Agutaya", "Araceli", "Balabac", "Bataraza", "Brooke's Point",
        "Busuanga", "Cagayancillo", "Coron", "Culion", "Cuyo", "Dumaran",
        "El Nido", "Kalayaan", "Linapacan", "Magsaysay", "Narra", "Quezon",
        "Rizal", "Roxas", "San Vicente", "Sofronio Española", "Taytay"
      ]
    },
    "Romblon": {
      cities: [],
      municipalities: [
        "Alcantara", "Banton", "Cajidiocan", "Calatrava", "Concepcion", "Corcuera",
        "Ferrol", "Looc", "Magdiwang", "Odiongan", "Romblon", "San Agustin",
        "San Andres", "San Fernando", "San Jose", "Santa Fe", "Santa Maria"
      ]
    }
  }
}, 
"Region V (Bicol Region)": {
  provinces: ["Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon"],
  locations: {
    "Albay": {
      cities: ["Legazpi", "Tabaco"],
      municipalities: [
        "Bacacay", "Daraga", "Guinobatan", "Jovellar", "Libon", "Malilipot", "Manito", "Oas", "Paquibato", 
        "Polangui", "Rapu-Rapu", "Santo Domingo", "Tiwi"
      ]
    },
    "Camarines Norte": {
      cities: [],
      municipalities: [
        "Basud", "Capalonga", "Daet", "Jose Panganiban", "Labo", "Mercedes", "Paracale", "San Vicente", 
        "Talisay", "Vinzons"
      ]
    },
    "Camarines Sur": {
      cities: ["Naga", "Iriga"],
      municipalities: [
        "Baao", "Balatan", "Bato", "Bombon", "Buhi", "Cabusao", "Calabanga", "Canaman", "Caramoan", "Del Gallego", 
        "Gainza", "Goa", "Libmanan", "Lupi", "Magarao", "Milaor", "Nabua", "Ocampo", "Pasacao", "Presentacion", 
        "Quipayo", "Ragay", "Sipocot", "Tigaon", "Tinambac"
      ]
    },
    "Catanduanes": {
      cities: ["Virac"],
      municipalities: [
        "Bagamanoc", "Baras", "Bato", "Caramoran", "Gigmoto", "Pandan", "Panganiban", "San Andres", "San Miguel",
        "Viga"
      ]
    },
    "Masbate": {
      cities: ["Masbate City"],
      municipalities: [
        "Aroroy", "Baleno", "Batuan", "Cataingan", "Cawayan", "Dimasalang", "Mandaon", "Milagros", "Mobo", 
        "Monreal", "Palanas", "Pio V. Corpuz", "Placer", "San Fernando", "San Jacinto", "San Pascual", "Uson"
      ]
    },
    "Sorsogon": {
      cities: ["Sorsogon City"],
      municipalities: [
        "Barcelona", "Bulan", "Casiguran", "Castilla", "Donsol", "Irosin", "Juban", "Magallanes", "Pto. Diaz", 
        "Prieto Diaz", "Santa Magdalena"
      ]
    }
  }
},
"Region VI (Western Visayas)": {
  provinces: ["Aklan", "Antique", "Capiz", "Guimaras", "Iloilo", "Negros Occidental"],
  locations: {
    "Aklan": {
      cities: ["Kalibo"],
      municipalities: [
        "Altavas", "Balete", "Banga", "Batan", "Buruanga", "Ibajay", "Lezo", "Libacao", "Madalag", 
        "Makato", "Malay", "Malinao", "Nabas", "New Washington", "Numancia"
      ]
    },
    "Antique": {
      cities: ["San Jose de Buenavista"],
      municipalities: [
        "Anini-y", "Barbaza", "Belison", "Bugasong", "Caluya", "Culasi", "Hamtic", "Laua-an", 
        "Libertad", "Pandan", "Patnongon", "San Remigio", "Sibalom", "Tibiao"
      ]
    },
    "Capiz": {
      cities: ["Roxas City"],
      municipalities: [
        "Ivisan", "Jamindan", "Mambusao", "Panay", "Pilar", "President Roxas", "Sapian", "Sigma", "Tapaz"
      ]
    },
    "Guimaras": {
      cities: ["Jordan"],
      municipalities: [
        "Bauang", "Buenavista", "Jordan", "Nueva Valencia", "San Lorenzo", "Santa Teresa"
      ]
    },
    "Iloilo": {
      cities: ["Iloilo City", "Passi City"],
      municipalities: [
        "Ajuy", "Alimodian", "Anilao", "Badiangan", "Balasan", "Banate", "Barotac Nuevo", "Barotac Viejo", 
        "Bingawan", "Cabatuan", "Calinog", "Carles", "Concepcion", "Dingle", "Dueñas", "Dumangas", "Estancia", 
        "Guimbal", "Igtuba", "Janiuay", "Leganes", "Lemery", "Leon", "Maasin", "Miag-ao", "Mina", "New Lucena", 
        "Oton", "Passi", "Pavia", "San Dionisio", "San Enrique", "San Joaquin", "San Miguel", "San Rafael", 
        "Sara", "Zarraga"
      ]
    },
    "Negros Occidental": {
      cities: ["Bacolod"],
      municipalities: [
        "Bago", "Binalbagan", "Cadiz", "Calatrava", "Candoni", "Cauayan", "Enrique B. Magalona", 
        "Himamaylan", "Hinigaran", "Hinobaan", "Kabankalan", "La Castellana", "Manapla", "Moises Padilla", 
        "Murcia", "Pontevedra", "Sagay", "San Carlos", "San Enrique", "Silay", "Talisay", "Toboso", 
        "Valladolid", "Victorias"
      ]
    }
  }
},
"Region VII (Central Visayas)": {
  provinces: ["Bohol", "Cebu", "Negros Oriental", "Siquijor"],
  locations: {
    "Bohol": {
      cities: ["Tagbilaran"],
      municipalities: [
        "Anda", "Antequera", "Bacong", "Basay", "Bohol", "Catigbian", "Carmen", "Candijay", "Corella", "Duero", 
        "Garcia Hernandez", "Guindulman", "Inabanga", "Jagna", "Loon", "Mabini", "Panglao", "Sagbayan", "San Isidro", 
        "San Miguel", "Sevilla", "Sikatuna", "Tubigon", "Ubay"
      ]
    },
    "Cebu": {
      cities: ["Cebu City", "Lapu-Lapu City", "Mandaue City"],
      municipalities: [
        "Alcantara", "Aloguinsan", "Argao", "Asturias", "Badian", "Balamban", "Bogo", "Carcar", "Carmen", "Catmon", 
        "Compostela", "Consolacion", "Cordova", "Danao", "Dumanjug", "Ginatilan", "Liloan", "Minglanilla", "Naga", 
        "Oslob", "Pilar", "Pinamungahan", "San Fernando", "San Remigio", "Santa Fe", "Santander", "Tabogon", "Tabuelan", 
        "Talisay", "Toledo"
      ]
    },
    "Negros Oriental": {
      cities: ["Dumaguete"],
      municipalities: [
        "Amlan", "Ayungon", "Bacong", "Basay", "Bais", "Canlaon", "Dauin", "Delfin Albano", "Dumaguete", "La Libertad", 
        "Mabinay", "Manjuyod", "Pamplona", "San Jose", "San Juan", "Santa Catalina", "Santo Niño", "Siaton", "Sibulan", 
        "Tanjay", "Valencia", "Zamboanguita"
      ]
    },
    "Siquijor": {
      cities: ["Siquijor"],
      municipalities: [
        "Lazi", "Larena", "Maria", "San Juan", "Siquijor"
      ]
    }
  }
},
"Region VIII (Eastern Visayas)": {
  provinces: ["Leyte", "Samar", "Southern Leyte", "Biliran", "Eastern Samar", "Northern Samar"],
  locations: {
    "Leyte": {
      cities: ["Tacloban"],
      municipalities: [
        "Abuyog", "Alangalang", "Babatngon", "Balangiga", "Basey", "Bato", "Burauen", "Capoocan", "Carigara", "Dagami", 
        "Dulag", "Hilongos", "Hindang", "Inopacan", "Isabel", "Jaro", "Javier", "Julita", "Kananga", "La Paz", "Laguna", 
        "Leyte", "Mahaplag", "Matag-ob", "Mayorga", "Milagro", "Palo", "Pastrana", "San Isidro", "San Miguel", "San Pablo", 
        "San Ricardo", "Santa Fe", "Santo Niño", "Tanauan", "Tolosa", "Tunga", "Villaba"
      ]
    },
    "Samar": {
      cities: ["Calbayog", "Catbalogan"],
      municipalities: [
        "Almagro", "Basey", "Bobon", "Calbiga", "Catbalogan", "Jiabong", "Marabut", "Matuguinao", "Motiong", "San Jorge", 
        "San Jose de Buan", "San Sebastian", "Santo Niño", "Santa Margarita", "Santa Rita", "Santo Niño", "Tarangnan", "Paranas"
      ]
    },
    "Southern Leyte": {
      cities: ["Maasin City"],
      municipalities: [
        "Anahawan", "Bontoc", "Hinunangan", "Hinundayan", "Libagon", "Liloan", "San Francisco", "San Juan", "San Ricardo", 
        "Sogod", "Tomas Oppus", "Pintuyan", "Saint Bernard", "Liloan", "Tigbao"
      ]
    },
    "Biliran": {
      cities: ["Naval"],
      municipalities: [
        "Almeria", "Biliran", "Caibiran", "Culaba", "Kawayan", "Maripipi"
      ]
    },
    "Eastern Samar": {
      cities: ["Borongan"],
      municipalities: [
        "Arteche", "Balangkayan", "Can-avid", "Dolores", "General MacArthur", "Guiuan", "Hernani", "Jipapad", "La Paz", 
        "Llorente", "Maslog", "Maydolong", "Mercedes", "Oras", "Quinapondan", "Salcedo", "San Julian", "San Policarpo", 
        "Sulat", "Taft"
      ]
    },
    "Northern Samar": {
      cities: ["Catarman"],
      municipalities: [
        "Allen", "Biri", "Bobon", "Capul", "Catarman", "Catubig", "Gamay", "Lavezares", "Las Navas", "Lope de Vega", 
        "Mapanas", "San Antonio", "San Vicente", "Silvino Lubos", "Victoria"
      ]
    }
  }
},
"Region IX (Zamboanga Peninsula)": {
  provinces: ["Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay"],
  locations: {
    "Zamboanga del Norte": {
      cities: ["Dipolog", "Dapitan"],
      municipalities: [
        "Antonio", "Baliguian", "Baliangao", "Godod", "Ipil", "Jose Dalman", "Kalawit", "La Libertad", 
        "Labason", "Lakewood", "Liloy", "Manukan", "Mutia", "Pilar", "Rizal", "Salug", "Sergio Osmeña Sr.", "Siayan", 
        "Sibuco", "Sindangan", "Siocon", "Tampilisan"
      ]
    },
    "Zamboanga del Sur": {
      cities: ["Pagadian"],
      municipalities: [
        "Aurora", "Bayog", "Dumalinao", "Dinas", "Guipos", "Josefina", "Kumalarang", "Lakewood", "Lapuyan", 
        "Mahayag", "Midsalip", "Molave", "Naga", "Pagadian", "Pitogo", "San Miguel", "San Pablo", "San Vicente", 
        "Sominot", "Tambulig", "Tabina", "Tigbao", "Lakewood", "Zamboanga City"
      ]
    },
    "Zamboanga Sibugay": {
      cities: ["Ipil"],
      municipalities: [
        "Diplahan", "Imelda", "Naga", "Olutanga", "Payao", "Talusan", "Titay", "Zamboanga del Sur"
      ]
    }
  }
},
"Region X (Northern Mindanao)": {
  provinces: ["Bukidnon", "Camiguin", "Lanao del Norte", "Misamis Occidental", "Misamis Oriental"],
  locations: {
    "Bukidnon": {
      cities: ["Malaybalay", "Valencia"],
      municipalities: [
        "Baungon", "Dangcagan", "Don Carlos", "Impasugong", "Kadingilan", "Kibawe", "Kitaotao", "Lantapan", 
        "Libona", "Malitbog", "Manolo Fortich", "Maramag", "Pangantucan", "Quezon", "Sumilao", "Talakag", "Tubod"
      ]
    },
    "Camiguin": {
      cities: ["Mambajao"],
      municipalities: [
        "Mahinog", "Guinsiliban", "Talimtiman", "Sagay", "Catarman"
      ]
    },
    "Lanao del Norte": {
      cities: ["Iligan"],
      municipalities: [
        "Bacolod", "Baloi", "Bariang", "Kapatagan", "Kauswagan", "Linamon", "Magsaysay", "Maigo", "Munai", "Nunungan", 
        "Pantaron", "Pantar", "Poona Piagapo", "Sapad", "Santo Niño", "Sultan Naga Dimaporo", "Tagoloan", "Tangub"
      ]
    },
    "Misamis Occidental": {
      cities: ["Ozamiz", "Tangub"],
      municipalities: [
        "Aloran", "Baliangao", "Bonifacio", "Calamba", "Clarin", "Concepcion", "Don Victoriano Chiongbian", "Looc", 
        "Panaon", "Plaridel", "Sapang Dalaga", "Sinacaban", "Tudela"
      ]
    },
    "Misamis Oriental": {
      cities: ["Cagayan de Oro", "Gingoog"],
      municipalities: [
        "Balingasag", "Balingoan", "Baungon", "Claveria", "El Salvador", "Gitagum", "Initao", "Jasaan", "Lagonglong", 
        "Libertad", "Manticao", "Medina", "Naawan", "Opol", "Salay", "Sugbongcogon"
      ]
    }
  }
},
"Region XI (Davao Region)": {
  provinces: ["Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental"],
  locations: {
    "Davao de Oro": {
      cities: ["Tagum"],
      municipalities: [
        "Andap", "Bansalan", "Bataan", "Bela", "Compostela", "Davao del Sur", "Digos", "Dulangan", "Guangan", 
        "Liboganon", "Magsaysay", "Magsingal", "Malita", "Matanao", "Milea", "Mongpong", "Padada", "Santiago", 
        "Santo Tomas", "Siay", "Silang", "Siton", "Tuna", "Vinapor"
      ]
    },
    "Davao del Norte": {
      cities: ["Tagum", "Davao City", "Panabo", "Samal", "Santo Tomas"],
      municipalities: [
        "Bansalan", "Bansang", "Cabangan", "Cabanac", "Dalit", "Davao Oriental", "Hagonoy", "Igpop", "Kalambugan", 
        "Lumbia", "Malabang", "Mati City", "New Albay", "Nina"
      ]
    },
    "Davao del Sur": {
      cities: ["Digos"],
      municipalities: [
        "Cotabato", "Digos City", "Sultan Kudarat", "Sarangani", "Tantangan"
      ]
    },
    "Davao Occidental": {
      cities: ["Davao City"],
      municipalities: [
        "Magsaysay", "Munai", "Mariano", "Santo"
      ]
    },
    "Davao Oriental": {
      cities: [],
      municipalities: [
        "Batio", "Baganga", "Banana", "Beirut", "Bethesda"
      ]
    }
  }
},
"Region XII (SOCCSKSARGEN)": {
  provinces: ["Sultan Kudarat", "South Cotabato", "Cotabato", "Sarangani"],
  locations: {
    "Sultan Kudarat": {
      cities: ["Tacurong"],
      municipalities: [
        "Bagumbayan", "Isulan", "Kalamansig", "Lambayong", "Lebak", "Lutayan", "Columbio"
      ]
    },
    "South Cotabato": {
      cities: ["Koronadal", "General Santos", "Polomolok", "Tupi", "Surallah"],
      municipalities: [
        "Banga", "Lake Sebu", "Santo Niño", "Tboli", "Tantangan"
      ]
    },
    "Cotabato": {
      cities: ["Cotabato City"],
      municipalities: [
        "Alamada", "Banisilan", "Carmen", "Kabacan", "Midsayap", "Pigkawayan", "Pikit", "Rosario", "Sultan Kudarat", 
        "Tulunan"
      ]
    },
    "Sarangani": {
      cities: ["Alabel", "Maasim", "Malapatan", "Glan", "Malungon"],
      municipalities: []
    }
  }
},
"Region XIII (Caraga)": {
  provinces: ["Agusan del Norte", "Agusan del Sur", "Surigao del Norte", "Surigao del Sur", "Dinagat Islands"],
  locations: {
    "Agusan del Norte": {
      cities: ["Butuan"],
      municipalities: [
        "Alegria", "Bunawan", "Cabadbaran", "Carmen", "Jabonga", "Kitcharao", "Las Nieves", "Magallanes", "Nasipit", "RTR"
      ]
    },
    "Agusan del Sur": {
      cities: ["Bayugan"],
      municipalities: [
        "Bunawan", "Esperanza", "La Paz", "Las Nieves", "Loreto", "San Francisco", "San Luis", "Santa Josefa", "Talacogon", "Trento"
      ]
    },
    "Surigao del Norte": {
      cities: ["Surigao City", "Sison", "Tagana-an"],
      municipalities: [
        "Bacuag", "Dapa", "Del Carmen", "Gigaquit", "Mainit", "Placer", "San Benito", "San Francisco", "San Isidro", "Santa Monica"
      ]
    },
    "Surigao del Sur": {
      cities: ["Tandag"],
      municipalities: [
        "Bayabas", "Cagwait", "Cantilan", "Carrascal", "Cortes", "Hagarap", "Lianga", "Madrid", "Marihatag", "San Agustin", "San Miguel"
      ]
    },
    "Dinagat Islands": {
      cities: ["Dinagat"],
      municipalities: [
        "Basilisa", "Cagdianao", "Dinagat", "Libjo", "San Jose", "Tubajon"
      ]
    }
  }
},
"National Capital Region (NCR)": {
  provinces: ["Metro Manila"],
  locations: {
    "Metro Manila": {
      cities: [
        "Manila", 
        "Quezon City", 
        "Caloocan", 
        "Pasay", 
        "Makati", 
        "Taguig", 
        "Parañaque", 
        "Las Piñas", 
        "Mandaluyong", 
        "Pasig", 
        "Marikina", 
        "San Juan", 
        "Valenzuela", 
        "Muntinlupa"
      ],
      municipalities: [
        "Pateros"
      ]
    }
  }
},

"Cordillera Administrative Region (CAR)": {
  provinces: ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"],
  locations: {
    "Abra": {
      cities: [],
      municipalities: [
        "Bangued", "Boliney", "Bukidnon", "Daguioman", "Dolores", "La Paz", "Lagangilang", "Langiden", 
        "Luba", "Manabo", "Penarrubia", "Pilar", "San Isidro", "San Juan", "San Quintin", "Tineg", 
        "Villaviciosa"
      ]
    },
    "Apayao": {
      cities: [],
      municipalities: [
        "Conner", "Flora", "Kabugao", "Luna", "Piat", "Santa Marcela"
      ]
    },
    "Benguet": {
      cities: ["Baguio"],
      municipalities: [
        "Atok", "Bokod", "Itogon", "Kabayan", "Kapangan", "Kibungan", "La Trinidad", "Mankayan", "Tuba", "Tublay"
      ]
    },
    "Ifugao": {
      cities: [],
      municipalities: [
        "Alfonso Lista", "Asipulo", "Hingyon", "Hungduan", "Kiangan", "Natonin", "Mayoyao", "Pulong", "Quiangan", 
        "Sadsadan", "Tinoc"
      ]
    },
    "Kalinga": {
      cities: [],
      municipalities: [
        "Balbalan", "Conner", "Kabasalan", "Kalinga", "Lubuagan", "Pasil", "Pinukpuk", "Rizal", "Tabuk", "Tanudan"
      ]
    },
    "Mountain Province": {
      cities: [],
      municipalities: [
        "Bontoc", "Natonin", "Paracelis", "Sabangan", "Sadanga", "Tadian"
      ]
    }
  }
},
"Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)": {
  provinces: ["Basilan", "Lanao del Sur", "Maguindanao", "Sulu", "Tawi-Tawi"],
  locations: {
    "Basilan": {
      cities: ["Isabela City"],
      municipalities: [
        "Akbar", "Al-Barka", "Hadji Mohammad Ajul", "Hadji Muhtamad", "Lamitan", "Maluso", "Sumisip", "Tipo-Tipo", 
        "Tuburan", "Lantawan"
      ]
    },
    "Lanao del Sur": {
      cities: ["Marawi City"],
      municipalities: [
        "Bacolod Kalawi", "Balindong", "Bayang", "Binidayan", "Buadiposo-Buntong", "Calanogas", "Ganassi", "Kapai", 
        "Kapatagan", "Lumbayanague", "Lumbatan", "Madalum", "Maguing", "Marantao", "Masiu", "Mulondo", "Pagayawan", 
        "Piagapo", "Poona Piagapo", "Salvador", "Sultan Dumalondong", "Tamparan", "Tugaya", "Wao"
      ]
    },
    "Maguindanao": {
      cities: [],
      municipalities: [
        "Barira", "Buldon", "Datu Blah Sinsuat", "Datu Odin Sinsuat", "Datu Piang", "Datu Unsay", "Kabuntalan", "Matanog", 
        "Northern Kabuntalan", "Pagalungan", "Pandag", "Parang", "Sultan Kudarat", "Sultan Mastura", "Tambilil", 
        "Upi"
      ]
    },
    "Sulu": {
      cities: ["Jolo"],
      municipalities: [
        "Banguingui", "Bungtod", "Indanan", "Kalingalan Caluang", "Kuratong", "Lugus", "Maimbung", "Panglima Estino", 
        "Pangutaran", "Parang", "Siasi", "Talipao", "Tapul"
      ]
    },
    "Tawi-Tawi": {
      cities: ["Bongao"],
      municipalities: [
        "Basilan", "Languyan", "Mapun", "Simunul", "Sapa-Sapa", "Turtle Islands", "Sitangkai", "South Ubian", "Panukulan"
      ]
    }
  }
}
};



export const zipCodeMapping = {
  "Region I (Ilocos Region)": {
    default: "",
    provinces: {
      "Ilocos Norte": {
        default: "",
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
        default: "",
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
        default: "",
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
        default: "",
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
    default: "",
    provinces: {
      "Batanes": {
        default: "",
        cities: {
          "Basco": ""
        },
        municipalities: {
          "Itbayat": "3901", "Ivana": "3902", "Mahatao": "3903", "Sabtang": "3904", "Uyugan": "3905"
        }
      },
      "Cagayan": {
        default: "",
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
        default: "",
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
        default: "",
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
        default: "",
        cities: {},
        municipalities: {
          "Cabarroguis": "3401", "Diffun": "3402", "Maddela": "3403", "Nagtipunan": "3404", "Saguday": "3405"
        }
      }
    }
  },

  "Region III (Central Luzon)": {
  default: "",
  provinces: {
    "Aurora": {
      default: "",
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
      default: "",
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
      default: "",
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
      default: "",
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
      default: "",
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
      default: "",
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
      default: "",
      cities: {
        "Olongapo City": "2200"
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
},
"Region IV-A (CALABARZON)": {
  provinces: {
    "Batangas": {
      cities: {
        "Batangas City": "4200",
        "Lipa": "4217",
        "Tanauan": "4232"
      },
      municipalities: {
        "Agoncillo": "4211",
        "Alitagtag": "4205",
        "Balayan": "4213",
        "Balete": "4219",
        "Bauan": "4201",
        "Calaca": "4212",
        "Calatagan": "4215",
        "Cuenca": "4222",
        "Ibaan": "4230",
        "Laurel": "4221",
        "Lemery": "4209",
        "Lian": "4216",
        "Lobo": "4229",
        "Mabini": "4202",
        "Malvar": "4233",
        "Mataasnakahoy": "4223",
        "Nasugbu": "4231",
        "Padre Garcia": "4224",
        "Rosario": "4225",
        "San Jose": "4227",
        "San Juan": "4226",
        "San Luis": "4210",
        "San Nicolas": "4207",
        "San Pascual": "4204",
        "Santa Teresita": "4206",
        "Santo Tomas": "4234",
        "Taal": "4208",
        "Talisay": "4220",
        "Taysan": "4228",
        "Tingloy": "4203",
        "Tuy": "4214"
      }
    },
    "Cavite": {
      cities: {
        "Bacoor": "4102",
        "Dasmariñas": "4114",
        "Imus": "4103",
        "Tagaytay": "4120",
        "Trece Martires": "4109"
      },
      municipalities: {
        "Alfonso": "4123",
        "Amadeo": "4119",
        "Carmona": "4116",
        "General Emilio Aguinaldo": "4124",
        "General Mariano Alvarez": "4117",
        "General Trias": "4107",
        "Indang": "4122",
        "Kawit": "4104",
        "Magallanes": "4113",
        "Maragondon": "4112",
        "Mendez": "4121",
        "Naic": "4110",
        "Noveleta": "4105",
        "Rosario": "4106",
        "Silang": "4118",
        "Tanza": "4108",
        "Ternate": "4111"
      }
    },
    "Laguna": {
      cities: {
        "Biñan": "4024",
        "Cabuyao": "4025",
        "Calamba": "4027",
        "San Pablo": "4000",
        "Santa Rosa": "4026"
      },
      municipalities: {
        "Alaminos": "4001",
        "Bay": "4033",
        "Calauan": "4012",
        "Famy": "4021",
        "Kalayaan": "4015",
        "Liliw": "4004",
        "Los Baños": "4030",
        "Luisiana": "4032",
        "Lumban": "4014",
        "Mabitac": "4020",
        "Magdalena": "4007",
        "Majayjay": "4005",
        "Nagcarlan": "4002",
        "Paete": "4016",
        "Pagsanjan": "4008",
        "Pakil": "4017",
        "Pangil": "4018",
        "Pila": "4010",
        "Rizal": "4003",
        "San Pedro": "4023",
        "Santa Cruz": "4009",
        "Santa Maria": "4022",
        "Siniloan": "4019",
        "Victoria": "4011"
      }
    },
    "Quezon": {
      cities: {
        "Lucena": "4301"
      },
      municipalities: {
        "Agdangan": "4304",
        "Alabat": "4333",
        "Atimonan": "4331",
        "Buenavista": "4320",
        "Burdeos": "4340",
        "Calauag": "4318",
        "Candelaria": "4323",
        "Catanauan": "4311",
        "Dolores": "4326",
        "General Luna": "4310",
        "General Nakar": "4335",
        "Guinayangan": "4319",
        "Gumaca": "4307",
        "Infanta": "4336",
        "Jomalig": "4342",
        "Lopez": "4316",
        "Lucban": "4328",
        "Macalelon": "4309",
        "Mauban": "4330",
        "Mulanay": "4312",
        "Padre Burgos": "4303",
        "Pagbilao": "4302",
        "Panukulan": "4341",
        "Patnanungan": "4343",
        "Perez": "4334",
        "Pitogo": "4308",
        "Plaridel": "4306",
        "Polillo": "4339",
        "Quezon": "4332",
        "Real": "4335",
        "Sampaloc": "4329",
        "San Andres": "4314",
        "San Antonio": "4324",
        "San Francisco": "4315",
        "San Narciso": "4313",
        "Sariaya": "4322",
        "Tagkawayan": "4321",
        "Tayabas": "4325",
        "Tiaong": "4320",
        "Unisan": "4305"
      }
    },
    "Rizal": {
      cities: {
        "Antipolo": "1870"
      },
      municipalities: {
        "Angono": "1930",
        "Baras": "1970",
        "Binangonan": "1940",
        "Cainta": "1900",
        "Cardona": "1950",
        "Jala-jala": "1990",
        "Morong": "1960",
        "Pililla": "1910",
        "Rodriguez": "1860",
        "San Mateo": "1850",
        "Tanay": "1980",
        "Taytay": "1920",
        "Teresa": "1880"
      }
    }
  }
},
"Region IV-B (MIMAROPA)": {
  provinces: {
    "Marinduque": {
      cities: [],
      municipalities: {
        "Boac": "4900",
        "Buenavista": "4904",
        "Gasan": "4905",
        "Mogpog": "4901",
        "Santa Cruz": "4902",
        "Torrijos": "4903"
      }
    },
    "Occidental Mindoro": {
      cities: [],
      municipalities: {
        "Abra de Ilog": "5108",
        "Calintaan": "5102",
        "Looc": "5111",
        "Lubang": "5109",
        "Magsaysay": "5101",
        "Mamburao": "5106",
        "Paluan": "5107",
        "Rizal": "5103",
        "Sablayan": "5104",
        "San Jose": "5100",
        "Santa Cruz": "5105"
      }
    },
    "Oriental Mindoro": {
      cities: {
        "Calapan": "5200"
      },
      municipalities: {
        "Baco": "5201",
        "Bansud": "5210",
        "Bongabong": "5211",
        "Bulalacao": "5214",
        "Gloria": "5209",
        "Mansalay": "5213",
        "Naujan": "5204",
        "Pinamalayan": "5208",
        "Pola": "5206",
        "Puerto Galera": "5203",
        "Roxas": "5212",
        "San Teodoro": "5202",
        "Socorro": "5207",
        "Victoria": "5205"
      }
    },
    "Palawan": {
      cities: {
        "Puerto Princesa": "5300"
      },
      municipalities: {
        "Aborlan": "5302",
        "Agutaya": "5321",
        "Araceli": "5311",
        "Balabac": "5307",
        "Bataraza": "5306",
        "Brooke's Point": "5305",
        "Busuanga": "5317",
        "Cagayancillo": "5322",
        "Coron": "5316",
        "Culion": "5315",
        "Cuyo": "5318",
        "Dumaran": "5310",
        "El Nido": "5313",
        "Kalayaan": "5323",
        "Linapacan": "5319",
        "Magsaysay": "5319",
        "Narra": "5303",
        "Quezon": "5304",
        "Rizal": "5301",
        "Roxas": "5308",
        "San Vicente": "5309",
        "Sofronio Española": "5312",
        "Taytay": "5312"
      }
    },
    "Romblon": {
      cities: {},
      municipalities: {
        "Alcantara": "5509",
        "Banton": "5515",
        "Cajidiocan": "5512",
        "Calatrava": "5510",
        "Concepcion": "5516",
        "Corcuera": "5514",
        "Ferrol": "5506",
        "Looc": "5507",
        "Magdiwang": "5511",
        "Odiongan": "5505",
        "Romblon": "5500",
        "San Agustin": "5501",
        "San Andres": "5504",
        "San Fernando": "5513",
        "San Jose": "5503",
        "Santa Fe": "5508",
        "Santa Maria": "5502"
      }
    }
  }
}, 
"Region V (Bicol Region)": {
  provinces: {
    "Albay": {
      default: "",
      cities: {
        "Legazpi": "4500",
        "Tabaco": "4511"
      },
      municipalities: {
        "Bacacay": "4502", "Daraga": "4503", "Guinobatan": "4504", "Jovellar": "4505", "Libon": "4506", 
        "Malilipot": "4507", "Manito": "4508", "Oas": "4509", "Paquibato": "4510", "Polangui": "4512", 
        "Rapu-Rapu": "4513", "Santo Domingo": "4514", "Tiwi": "4515"
      }
    },
    "Camarines Norte": {
      default: "",
      cities: {},
      municipalities: {
        "Basud": "4601", "Capalonga": "4602", "Daet": "4603", "Jose Panganiban": "4604", "Labo": "4605", 
        "Mercedes": "4606", "Paracale": "4607", "San Vicente": "4608", "Talisay": "4609", "Vinzons": "4610"
      }
    },
    "Camarines Sur": {
      default: "",
      cities: {
        "Naga": "4400",
        "Iriga": "4431"
      },
      municipalities: {
        "Baao": "4401", "Balatan": "4402", "Bato": "4403", "Bombon": "4404", "Buhi": "4405", "Cabusao": "4406", 
        "Calabanga": "4407", "Canaman": "4408", "Caramoan": "4409", "Del Gallego": "4410", "Gainza": "4411", 
        "Goa": "4412", "Libmanan": "4413", "Lupi": "4414", "Magarao": "4415", "Milaor": "4416", "Nabua": "4417", 
        "Ocampo": "4418", "Pasacao": "4419", "Presentacion": "4420", "Quipayo": "4421", "Ragay": "4422", "Sipocot": "4423", 
        "Tigaon": "4424", "Tinambac": "4425"
      }
    },
    "Catanduanes": {
      default: "",
      cities: {
        "Virac": "4800"
      },
      municipalities: {
        "Bagamanoc": "4801", "Baras": "4802", "Bato": "4803", "Caramoran": "4804", "Gigmoto": "4805", 
        "Pandan": "4806", "Panganiban": "4807", "San Andres": "4808", "San Miguel": "4809", "Viga": "4810"
      }
    },
    "Masbate": {
      default: "",
      cities: {
        "Masbate City": "5400"
      },
      municipalities: {
        "Aroroy": "5401", "Baleno": "5402", "Batuan": "5403", "Cataingan": "5404", "Cawayan": "5405", 
        "Dimasalang": "5406", "Mandaon": "5407", "Milagros": "5408", "Mobo": "5409", "Monreal": "5410", 
        "Palanas": "5411", "Pio V. Corpuz": "5412", "Placer": "5413", "San Fernando": "5414", "San Jacinto": "5415", 
        "San Pascual": "5416", "Uson": "5417"
      }
    },
    "Sorsogon": {
      default: "",
      cities: {
        "Sorsogon City": "4700"
      },
      municipalities: {
        "Barcelona": "4701", "Bulan": "4702", "Casiguran": "4703", "Castilla": "4704", "Donsol": "4705", 
        "Irosin": "4706", "Juban": "4707", "Magallanes": "4708", "Pto. Diaz": "4709", "Prieto Diaz": "4710", 
        "Santa Magdalena": "4711"
      }
    }
  }
},
"Region VI (Western Visayas)": {
  provinces: {
    "Aklan": {
      default: "",
      cities: {
        "Kalibo": "5600",
        "Lezo": "5601"
      },
      municipalities: {
        "Altavas": "5602", "Balete": "5603", "Banga": "5604", "Batan": "5605", "Buruanga": "5606", "Ibajay": "5607", 
        "Kalibo": "5600", "Lezo": "5601", "Libacao": "5608", "Madalag": "5609", "Makato": "5610", "Malay": "5611", 
        "Nabas": "5612", "New Washington": "5613", "Numancia": "5614"
      }
    },
    "Antique": {
      default: "",
      cities: {
        "San Jose": "5700"
      },
      municipalities: {
        "Anini-y": "5701", "Barbaza": "5702", "Belison": "5703", "Bugasong": "5704", "Caluya": "5705", "Hamtic": "5706", 
        "Libertad": "5707", "Pandan": "5708", "Patnongon": "5709", "San Jose": "5700", "San Remigio": "5710", "Sibalom": "5711", 
        "Tibiao": "5712", "Valderrama": "5713"
      }
    },
    "Capiz": {
      default: "",
      cities: {
        "Roxas": "5800"
      },
      municipalities: {
        "Ma-ayon": "5801", "Panay": "5802", "Pilar": "5803", "Ivisan": "5804", "Jamindan": "5805", "Mambusao": "5806", 
        "Mina": "5807", "Panitan": "5808", "Pontevedra": "5809", "President Roxas": "5810", "Sapian": "5811", "Sigma": "5812", 
        "Tapaz": "5813"
      }
    },
    "Guimaras": {
      default: "",
      cities: {
        "Jordan": "5000"
      },
      municipalities: {
        "Buenavista": "5001", "Jordan": "5000", "Luna": "5002", "Macho": "5003", "Nueva Valencia": "5004", "San Lorenzo": "5005"
      }
    },
    "Iloilo": {
      default: "",
      cities: {
        "Iloilo City": "5000",
        "Passi City": "5013"
      },
      municipalities: {
        "Ajuy": "5001", "Alimodian": "5002", "Anilao": "5003", "Badiangan": "5004", "Balasan": "5005", "Banate": "5006", 
        "Barotac Nuevo": "5007", "Barotac Viejo": "5008", "Bingawan": "5009", "Cabatuan": "5010", "Calinog": "5011", 
        "Carles": "5012", "Concepcion": "5014", "Dingle": "5015", "Dumangas": "5016", "Estancia": "5017", "Guimbal": "5018", 
        "Igbaras": "5019", "Janiuay": "5020", "Lambunao": "5021", "Leganes": "5022", "Lemery": "5023", "Leon": "5024", 
        "Mina": "5025", "New Lucena": "5026", "Oton": "5027", "Passi": "5028", "Pavia": "5029", "San Dionisio": "5030", 
        "San Enrique": "5031", "San Joaquin": "5032", "San Rafael": "5033", "Sara": "5034", "Tigbauan": "5035", "Zarraga": "5036"
      }
    },
    "Negros Occidental": {
      default: "",
      cities: {
        "Bacolod": "6100"
      },
      municipalities: {
        "Bago": "6101", "Binalbagan": "6102", "Cadiz": "6103", "Calatrava": "6104", "Candoni": "6105", "Cauayan": "6106", 
        "Enrique B. Magalona": "6107", "Himamaylan": "6108", "Hinigaran": "6109", "Hinobaan": "6110", "Kabankalan": "6111", 
        "La Castellana": "6112", "Manapla": "6113", "Moises Padilla": "6114", "Murcia": "6115", "Pontevedra": "6116", 
        "Sagay": "6117", "San Carlos": "6118", "San Enrique": "6119", "Silay": "6120", "Talisay": "6121", "Toboso": "6122", 
        "Valladolid": "6123", "Victorias": "6124"
      }
    }
  }
},
"Region VII (Central Visayas)": {
  provinces: {
    "Bohol": {
      default: "",
      cities: {
        "Tagbilaran": "6300"
      },
      municipalities: {
        "Anda": "6301", "Antequera": "6302", "Baclayon": "6303", "Bilar": "6304", "Bohol": "6305", "Catigbian": "6306", 
        "Carmen": "6307", "Candijay": "6308", "Corella": "6309", "Duero": "6310", "Garcia Hernandez": "6311", "Guindulman": "6312", 
        "Inabanga": "6313", "Jagna": "6314", "Loon": "6315", "Mabini": "6316", "Panglao": "6317", "Sagbayan": "6318", 
        "San Isidro": "6319", "San Miguel": "6320", "Sevilla": "6321", "Sikatuna": "6322", "Tubigon": "6323", "Ubay": "6324"
      }
    },
    "Cebu": {
      default: "",
      cities: {
        "Cebu City": "6000", "Lapu-Lapu City": "6015", "Mandaue City": "6014"
      },
      municipalities: {
        "Alcantara": "6010", "Aloguinsan": "6011", "Argao": "6012", "Asturias": "6013", "Badian": "6016", "Balamban": "6017", 
        "Bogo": "6018", "Carcar": "6021", "Carmen": "6022", "Catmon": "6023", "Compostela": "6024", "Consolacion": "6025", 
        "Cordova": "6026", "Danao": "6027", "Dumanjug": "6028", "Ginatilan": "6029", "Liloan": "6030", "Minglanilla": "6031", 
        "Naga": "6032", "Oslob": "6033", "Pilar": "6034", "Pinamungahan": "6035", "San Fernando": "6036", "San Remigio": "6037", 
        "Santa Fe": "6038", "Santander": "6039", "Tabogon": "6040", "Tabuelan": "6041", "Talisay": "6042", "Toledo": "6043"
      }
    },
    "Negros Oriental": {
      default: "",
      cities: {
        "Dumaguete": "6200"
      },
      municipalities: {
        "Amlan": "6201", "Ayungon": "6202", "Bacong": "6203", "Basay": "6204", "Bais": "6205", "Canlaon": "6206", 
        "Dauin": "6207", "Delfin Albano": "6208", "Dumaguete": "6200", "La Libertad": "6209", "Mabinay": "6210", 
        "Manjuyod": "6211", "Pamplona": "6212", "San Jose": "6213", "San Juan": "6214", "Santa Catalina": "6215", 
        "Santo Niño": "6216", "Siaton": "6217", "Sibulan": "6218", "Tanjay": "6219", "Valencia": "6220", "Zamboanguita": "6221"
      }
    },
    "Siquijor": {
      default: "",
      cities: {
        "Siquijor": "6227"
      },
      municipalities: {
        "Lazi": "6228", "Larena": "6229", "Maria": "6230", "San Juan": "6231", "Siquijor": "6227"
      }
    }
  }
},
"Region VIII (Eastern Visayas)": {
  provinces: {
    "Leyte": {
      default: "",
      cities: {
        "Tacloban": "6500"
      },
      municipalities: {
        "Abuyog": "6510", "Alangalang": "6511", "Babatngon": "6512", "Balangiga": "6513", "Basey": "6514", 
        "Bato": "6515", "Burauen": "6516", "Capoocan": "6517", "Carigara": "6518", "Dagami": "6519", "Dulag": "6520",
        "Hilongos": "6521", "Hindang": "6522", "Inopacan": "6523", "Isabel": "6524", "Jaro": "6525", "Javier": "6526", 
        "Julita": "6527", "Kananga": "6528", "La Paz": "6529", "Laguna": "6530", "Leyte": "6531", "Mahaplag": "6532", 
        "Matag-ob": "6533", "Mayorga": "6534", "Milagro": "6535", "Palo": "6536", "Pastrana": "6537", "San Isidro": "6538", 
        "San Miguel": "6539", "San Pablo": "6540", "San Ricardo": "6541", "Santa Fe": "6542", "Santo Niño": "6543", 
        "Tanauan": "6544", "Tolosa": "6545", "Tunga": "6546", "Villaba": "6547"
      }
    },
    "Samar": {
      default: "",
      cities: {
        "Calbayog": "6700",
        "Catbalogan": "6701"
      },
      municipalities: {
        "Almagro": "6702", "Basey": "6703", "Bobon": "6704", "Calbiga": "6705", "Catbalogan": "6706", "Jiabong": "6707", 
        "Marabut": "6708", "Matuguinao": "6709", "Motiong": "6710", "San Jorge": "6711", "San Jose de Buan": "6712", 
        "San Sebastian": "6713", "Santo Niño": "6714", "Santa Margarita": "6715", "Santa Rita": "6716", "Santo Niño": "6717", 
        "Tarangnan": "6718", "Paranas": "6719"
      }
    },
    "Southern Leyte": {
      default: "",
      cities: {
        "Maasin City": "6600"
      },
      municipalities: {
        "Anahawan": "6601", "Bontoc": "6602", "Hinunangan": "6603", "Hinundayan": "6604", "Libagon": "6605", "Liloan": "6606",
        "San Francisco": "6607", "San Juan": "6608", "San Ricardo": "6609", "Sogod": "6610", "Tomas Oppus": "6611", 
        "Pintuyan": "6612", "Saint Bernard": "6613", "Liloan": "6614", "Tigbao": "6615"
      }
    },
    "Biliran": {
      default: "",
      cities: {
        "Naval": "6540"
      },
      municipalities: {
        "Almeria": "6541", "Biliran": "6542", "Caibiran": "6543", "Culaba": "6544", "Kawayan": "6545", "Maripipi": "6546"
      }
    },
    "Eastern Samar": {
      default: "",
      cities: {
        "Borongan": "6800"
      },
      municipalities: {
        "Arteche": "6801", "Balangkayan": "6802", "Can-avid": "6803", "Dolores": "6804", "General MacArthur": "6805", 
        "Guiuan": "6806", "Hernani": "6807", "Jipapad": "6808", "La Paz": "6809", "Llorente": "6810", "Maslog": "6811", 
        "Maydolong": "6812", "Mercedes": "6813", "Oras": "6814", "Quinapondan": "6815", "Salcedo": "6816", "San Julian": "6817",
        "San Policarpo": "6818", "Sulat": "6819", "Taft": "6820"
      }
    },
    "Northern Samar": {
      default: "",
      cities: {
        "Catarman": "6400"
      },
      municipalities: {
        "Allen": "6401", "Biri": "6402", "Bobon": "6403", "Capul": "6404", "Catarman": "6405", "Catubig": "6406", 
        "Gamay": "6407", "Lavezares": "6408", "Las Navas": "6409", "Lope de Vega": "6410", "Mapanas": "6411", "San Antonio": "6412",
        "San Vicente": "6413", "Silvino Lubos": "6414", "Victoria": "6415"
      }
    }
  }
},
"Region IX (Zamboanga Peninsula)": {
  provinces: {
    "Zamboanga del Norte": {
      default: "",
      cities: {
        "Dipolog": "7100",
        "Dapitan": "7101"
      },
      municipalities: {
        "Antonio": "7102", "Baliguian": "7103", "Baliangao": "7104", "Godod": "7105", "Ipil": "7106", "Jose Dalman": "7107", 
        "Kalawit": "7108", "La Libertad": "7109", "Labason": "7110", "Lakewood": "7111", "Liloy": "7112", "Manukan": "7113", 
        "Mutia": "7114", "Pilar": "7115", "Rizal": "7116", "Salug": "7117", "Sergio Osmeña Sr.": "7118", "Siayan": "7119", 
        "Sibuco": "7120", "Sindangan": "7121", "Siocon": "7122", "Tampilisan": "7123"
      }
    },
    "Zamboanga del Sur": {
      default: "",
      cities: {
        "Pagadian": "7010"
      },
      municipalities: {
        "Aurora": "7011", "Bayog": "7012", "Dumalinao": "7013", "Dinas": "7014", "Guipos": "7015", "Josefina": "7016", 
        "Kumalarang": "7017", "Lakewood": "7018", "Lapuyan": "7019", "Mahayag": "7020", "Midsalip": "7021", "Molave": "7022", 
        "Naga": "7023", "Pagadian": "7024", "Pitogo": "7025", "San Miguel": "7026", "San Pablo": "7027", "San Vicente": "7028", 
        "Sominot": "7029", "Tambulig": "7030", "Tabina": "7031", "Tigbao": "7032", "Lakewood": "7033", "Zamboanga City": "7034"
      }
    },
    "Zamboanga Sibugay": {
      default: "",
      cities: {
        "Ipil": "7000"
      },
      municipalities: {
        "Diplahan": "7001", "Imelda": "7002", "Naga": "7003", "Olutanga": "7004", "Payao": "7005", "Talusan": "7006", 
        "Titay": "7007", "Zamboanga del Sur": "7008"
      }
    }
  }
},
"Region X (Northern Mindanao)": {
  provinces: {
    "Bukidnon": {
      default: "",
      cities: {
        "Malaybalay": "8700",
        "Valencia": "8709"
      },
      municipalities: {
        "Baungon": "8701", "Dangcagan": "8702", "Don Carlos": "8703", "Impasugong": "8704", "Kadingilan": "8705", 
        "Kibawe": "8706", "Kitaotao": "8707", "Lantapan": "8708", "Libona": "8710", "Malitbog": "8711", "Manolo Fortich": "8712", 
        "Maramag": "8713", "Pangantucan": "8714", "Quezon": "8715", "Sumilao": "8716", "Talakag": "8717", "Tubod": "8718"
      }
    },
    "Camiguin": {
      default: "",
      cities: {
        "Mambajao": "9100"
      },
      municipalities: {
        "Mahinog": "9101", "Guinsiliban": "9102", "Talimtiman": "9103", "Sagay": "9104", "Catarman": "9105"
      }
    },
    "Lanao del Norte": {
      default: "",
      cities: {
        "Iligan": "9200"
      },
      municipalities: {
        "Bacolod": "9201", "Baloi": "9202", "Bariang": "9203", "Kapatagan": "9204", "Kauswagan": "9205", 
        "Linamon": "9206", "Magsaysay": "9207", "Maigo": "9208", "Munai": "9209", "Nunungan": "9210", 
        "Pantaron": "9211", "Pantar": "9212", "Poona Piagapo": "9213", "Sapad": "9214", "Santo Niño": "9215", 
        "Sultan Naga Dimaporo": "9216", "Tagoloan": "9217", "Tangub": "9218"
      }
    },
    "Misamis Occidental": {
      default: "",
      cities: {
        "Ozamiz": "7200",
        "Tangub": "7210"
      },
      municipalities: {
        "Aloran": "7201", "Baliangao": "7202", "Bonifacio": "7203", "Calamba": "7204", "Clarin": "7205", 
        "Concepcion": "7206", "Don Victoriano Chiongbian": "7207", "Looc": "7208", "Panaon": "7209", "Plaridel": "7211", 
        "Sapang Dalaga": "7212", "Sinacaban": "7213", "Tudela": "7214"
      }
    },
    "Misamis Oriental": {
      default: "",
      cities: {
        "Cagayan de Oro": "9000",
        "Gingoog": "9010"
      },
      municipalities: {
        "Balingasag": "9001", "Balingoan": "9002", "Baungon": "9003", "Claveria": "9004", "El Salvador": "9005", 
        "Gitagum": "9006", "Initao": "9007", "Jasaan": "9008", "Lagonglong": "9009", "Libertad": "9011", "Manticao": "9012", 
        "Medina": "9013", "Naawan": "9014", "Opol": "9015", "Salay": "9016", "Sugbongcogon": "9017"
      }
    }
  }
},
"Region XI (Davao Region)": {
  provinces: {
    "Davao de Oro": {
      default: "",
      cities: {
        "Tagum": "8100"
      },
      municipalities: {
        "Andap": "8101", "Bansalan": "8102", "Bataan": "8103", "Bela": "8104", "Compostela": "8105", 
        "Davao del Sur": "8106", "Digos": "8107", "Dulangan": "8108", "Guangan": "8109", "Liboganon": "8110", 
        "Magsaysay": "8111", "Magsingal": "8112", "Malita": "8113", "Matanao": "8114", "Milea": "8115", 
        "Mongpong": "8116", "Padada": "8117", "Santiago": "8118", "Santo Tomas": "8119", "Siay": "8120", 
        "Silang": "8121", "Siton": "8122", "Tuna": "8123", "Vinapor": "8124"
      }
    },
    "Davao del Norte": {
      default: "",
      cities: {
        "Tagum": "8100", "Davao City": "8100", "Panabo": "8100", "Samal": "8100", "Santo Tomas": "8100"
      },
      municipalities: {
        "Bansalan": "8101", "Bansang": "8102", "Cabangan": "8103", "Cabanac": "8104", "Dalit": "8105", 
        "Davao Oriental": "8106", "Hagonoy": "8107", "Igpop": "8108", "Kalambugan": "8109", "Lumbia": "8110", 
        "Malabang": "8111", "Mati City": "8112", "New Albay": "8113", "Nina": "8114"
      }
    },
    "Davao del Sur": {
      default: "",
      cities: {
        "Digos": "8100"
      },
      municipalities: {
        "Cotabato": "8101", "Digos City": "8102", "Sultan Kudarat": "8103", "Saranggani": "8104", "Tantangan": "8105"
      }
    },
    "Davao Occidental": {
      default: "",
      cities: {
        "Davao City": "8100"
      },
      municipalities: {
        "Magsaysay": "8101", "Munai": "8102", "Mariano": "8103", "Santo": "8104"
      }
    },
    "Davao Oriental": {
      default: "",
      cities: {},
      municipalities: {
        "Batio": "8101", "Baganga": "8102", "Banana": "8103", "Beirut": "8104", "Bethesda": "8105"
      }
    }
  }
},
"Region XII (SOCCSKSARGEN)": {
  provinces: {
    "Sultan Kudarat": {
      default: "",
      cities: {
        "Tacurong": "9800"
      },
      municipalities: {
        "Bagumbayan": "9801", "Isulan": "9802", "Kalamansig": "9803", "Lambayong": "9804", "Lebak": "9805", 
        "Lutayan": "9806", "Columbio": "9807"
      }
    },
    "South Cotabato": {
      default: "",
      cities: {
        "Koronadal": "9500", "General Santos": "9501", "Polomolok": "9502", "Tupi": "9503", "Surallah": "9504"
      },
      municipalities: {
        "Banga": "9505", "Lake Sebu": "9506", "Santo Niño": "9507", "Tboli": "9508", "Tantangan": "9509"
      }
    },
    "Cotabato": {
      default: "",
      cities: {
        "Cotabato City": "9400"
      },
      municipalities: {
        "Alamada": "9401", "Banisilan": "9402", "Carmen": "9403", "Kabacan": "9404", "Midsayap": "9405", 
        "Pigkawayan": "9406", "Pikit": "9407", "Rosario": "9408", "Sultan Kudarat": "9409", "Tulunan": "9410"
      }
    },
    "Sarangani": {
      default: "",
      cities: {
        "Alabel": "9501", "Maasim": "9502", "Malapatan": "9503", "Glan": "9504", "Malungon": "9505"
      },
      municipalities: {}
    }
  }
},
"Region XIII (Caraga)": {
  provinces: {
    "Agusan del Norte": {
      default: "",
      cities: {
        "Butuan": "8600"
      },
      municipalities: {
        "Alegria": "8601", "Bunawan": "8602", "Cabadbaran": "8603", "Carmen": "8604", "Jabonga": "8605", 
        "Kitcharao": "8606", "Las Nieves": "8607", "Magallanes": "8608", "Nasipit": "8609", "RTR": "8610"
      }
    },
    "Agusan del Sur": {
      default: "",
      cities: {
        "Bayugan": "8500"
      },
      municipalities: {
        "Bunawan": "8501", "Esperanza": "8502", "La Paz": "8503", "Las Nieves": "8504", "Loreto": "8505", 
        "San Francisco": "8506", "San Luis": "8507", "Santa Josefa": "8508", "Talacogon": "8509", "Trento": "8510"
      }
    },
    "Surigao del Norte": {
      default: "",
      cities: {
        "Surigao City": "8400", "Sison": "8401", "Tagana-an": "8402"
      },
      municipalities: {
        "Bacuag": "8403", "Dapa": "8404", "Del Carmen": "8405", "Gigaquit": "8406", "Mainit": "8407", 
        "Placer": "8408", "San Benito": "8409", "San Francisco": "8410", "San Isidro": "8411", "Santa Monica": "8412"
      }
    },
    "Surigao del Sur": {
      default: "",
      cities: {
        "Tandag": "8300"
      },
      municipalities: {
        "Bayabas": "8301", "Cagwait": "8302", "Cantilan": "8303", "Carrascal": "8304", "Cortes": "8305", 
        "Hagarap": "8306", "Lianga": "8307", "Madrid": "8308", "Marihatag": "8309", "San Agustin": "8310", "San Miguel": "8311"
      }
    },
    "Dinagat Islands": {
      default: "",
      cities: {
        "Dinagat": "8400"
      },
      municipalities: {
        "Basilisa": "8401", "Cagdianao": "8402", "Dinagat": "8403", "Libjo": "8404", "San Jose": "8405", 
        "Tubajon": "8406"
      }
    }
  }
},
"National Capital Region (NCR)": {
  provinces: {
    "Metro Manila": {
      default: "",
      cities: {
        "Manila": "1000",
        "Quezon City": "1100",
        "Caloocan": "1400",
        "Pasay": "1300",
        "Makati": "1200",
        "Taguig": "1630",
        "Parañaque": "1700",
        "Las Piñas": "1740",
        "Mandaluyong": "1550",
        "Pasig": "1600",
        "Marikina": "1800",
        "San Juan": "1500",
        "Valenzuela": "1440",
        "Muntinlupa": "1770"
      },
      municipalities: {
        "Pateros": "1620"
      }
    }
  }
},

"Cordillera Administrative Region (CAR)": {
  provinces: {
    "Abra": {
      default: "",
      cities: {},
      municipalities: {
        "Bangued": "2800", "Boliney": "2801", "Bukidnon": "2802", "Daguioman": "2803", "Dolores": "2804", 
        "La Paz": "2805", "Lagangilang": "2806", "Langiden": "2807", "Luba": "2808", "Manabo": "2809", 
        "Penarrubia": "2810", "Pilar": "2811", "San Isidro": "2812", "San Juan": "2813", "San Quintin": "2814", 
        "Tineg": "2815", "Villaviciosa": "2816"
      }
    },
    "Apayao": {
      default: "",
      cities: {},
      municipalities: {
        "Conner": "3816", "Flora": "3817", "Kabugao": "3818", "Luna": "3819", "Piat": "3820", "Santa Marcela": "3821"
      }
    },
    "Benguet": {
      default: "",
      cities: {
        "Baguio": "2600"
      },
      municipalities: {
        "Atok": "2601", "Bokod": "2602", "Itogon": "2603", "Kabayan": "2604", "Kapangan": "2605", "Kibungan": "2606", 
        "La Trinidad": "2607", "Mankayan": "2608", "Tuba": "2609", "Tublay": "2610"
      }
    },
    "Ifugao": {
      default: "",
      cities: {},
      municipalities: {
        "Alfonso Lista": "3601", "Asipulo": "3602", "Hingyon": "3603", "Hungduan": "3604", "Kiangan": "3605", 
        "Natonin": "3606", "Mayoyao": "3607", "Pulong": "3608", "Quiangan": "3609", "Sadsadan": "3610", "Tinoc": "3611"
      }
    },
    "Kalinga": {
      default: "",
      cities: {},
      municipalities: {
        "Balbalan": "3801", "Conner": "3802", "Kabasalan": "3803", "Kalinga": "3804", "Lubuagan": "3805", 
        "Pasil": "3806", "Pinukpuk": "3807", "Rizal": "3808", "Tabuk": "3809", "Tanudan": "3810"
      }
    },
    "Mountain Province": {
      default: "",
      cities: {},
      municipalities: {
        "Bontoc": "2611", "Natonin": "2612", "Paracelis": "2613", "Sabangan": "2614", "Sadanga": "2615", "Tadian": "2616"
      }
    }
  }
},
"Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)": {
  provinces: {
    "Basilan": {
      default: "",
      cities: {
        "Isabela City": "7300"
      },
      municipalities: {
        "Akbar": "7301", "Al-Barka": "7302", "Hadji Mohammad Ajul": "7303", "Hadji Muhtamad": "7304", 
        "Lamitan": "7305", "Maluso": "7306", "Sumisip": "7307", "Tipo-Tipo": "7308", "Tuburan": "7309", 
        "Lantawan": "7310"
      }
    },
    "Lanao del Sur": {
      default: "",
      cities: {
        "Marawi City": "9700"
      },
      municipalities: {
        "Bacolod Kalawi": "9701", "Balindong": "9702", "Bayang": "9703", "Binidayan": "9704", "Buadiposo-Buntong": "9705", 
        "Calanogas": "9706", "Ganassi": "9707", "Kapai": "9708", "Kapatagan": "9709", "Lumbayanague": "9710", 
        "Lumbatan": "9711", "Madalum": "9712", "Maguing": "9713", "Marantao": "9714", "Masiu": "9715", 
        "Mulondo": "9716", "Pagayawan": "9717", "Piagapo": "9718", "Poona Piagapo": "9719", "Salvador": "9720", 
        "Sultan Dumalondong": "9721", "Tamparan": "9722", "Tugaya": "9723", "Wao": "9724"
      }
    },
    "Maguindanao": {
      default: "",
      cities: {},
      municipalities: {
        "Barira": "9601", "Buldon": "9602", "Datu Blah Sinsuat": "9603", "Datu Odin Sinsuat": "9604", "Datu Piang": "9605", 
        "Datu Unsay": "9606", "Kabuntalan": "9607", "Matanog": "9608", "Northern Kabuntalan": "9609", 
        "Pagalungan": "9610", "Pandag": "9611", "Parang": "9612", "Sultan Kudarat": "9613", "Sultan Mastura": "9614", 
        "Tambilil": "9615", "Upi": "9616"
      }
    },
    "Sulu": {
      default: "",
      cities: {
        "Jolo": "7400"
      },
      municipalities: {
        "Banguingui": "7401", "Bungtod": "7402", "Indanan": "7403", "Kalingalan Caluang": "7404", "Kuratong": "7405", 
        "Lugus": "7406", "Maimbung": "7407", "Panglima Estino": "7408", "Pangutaran": "7409", "Parang": "7410", 
        "Siasi": "7411", "Talipao": "7412", "Tapul": "7413"
      }
    },
    "Tawi-Tawi": {
      default: "",
      cities: {
        "Bongao": "7500"
      },
      municipalities: {
        "Basilan": "7501", "Languyan": "7502", "Mapun": "7503", "Simunul": "7504", "Sapa-Sapa": "7505", 
        "Turtle Islands": "7506", "Sitangkai": "7507", "South Ubian": "7508", "Panukulan": "7509"
      }
    }
  }
}
};




