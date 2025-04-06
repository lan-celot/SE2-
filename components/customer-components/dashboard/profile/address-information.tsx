"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/customer-components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/customer-components/ui/dialog"
import { Input } from "@/components/customer-components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/customer-components/ui/select"
import { PencilIcon, XIcon } from "lucide-react"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase" // Adjust the import path to your Firebase config
import { getAuth, onAuthStateChanged } from "firebase/auth"

// Type definitions for location data
type Region = string;
type City = string;
type Municipality = string;
type Province = string;

interface LocationData {
  provinces: Province[];
  cities: {
    [province: string]: City[];
  };
  municipalities: {
    [province: string]: Municipality[];
  };
  cityZipCodes: {
    [city: string]: string;
  };
  municipalityZipCodes: {
    [municipality: string]: string;
  };
}

interface LocationHierarchy {
  [region: string]: LocationData;
}

// Philippine location data
const philippineRegions: Region[] = [
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

// Location Hierarchy with separate city and municipality data
const locationHierarchy: LocationHierarchy = {
  "Region I (Ilocos Region)": {
    provinces: ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
    cities: {
      "Ilocos Norte": ["Laoag", "Batac"],
      "Ilocos Sur": ["Vigan", "Candon"],
      "La Union": ["San Fernando"],
      "Pangasinan": ["Dagupan", "Alaminos", "San Carlos", "Urdaneta"]
    },
    municipalities: {
      "Ilocos Norte": ["Paoay", "Pagudpud"],
      "Ilocos Sur": ["Bantay", "Narvacan"],
      "La Union": ["Agoo", "Bauang"],
      "Pangasinan": []
    },
    cityZipCodes: {
      "Laoag": "2900",
      "Batac": "2906",
      "Vigan": "2700",
      "Candon": "2713",
      "San Fernando": "2500",
      "Dagupan": "2400",
      "Alaminos": "2404",
      "San Carlos": "2420",
      "Urdaneta": "2428",
    },
    municipalityZipCodes: {
      "Paoay": "2909",
      "Pagudpud": "2919",
      "Bantay": "2728",
      "Narvacan": "2712",
      "Agoo": "2508",
      "Bauang": "2501",
    }
  },
  // Add more regions here as needed
};

// Address interface instead of schema (removing zod dependency)
interface AddressFormValues {
  region: string;
  province: string;
  city?: string;
  municipality?: string;
  zipCode?: string;
  streetAddress: string;
}

// Default empty address
const emptyAddress: AddressFormValues = {
  region: "",
  province: "",
  city: "",
  municipality: "",
  zipCode: "",
  streetAddress: ""
};

interface AddressInformationProps {
  userId?: string;
  initialAddress?: AddressFormValues;
}

export function AddressInformation({ 
  userId: providedUserId, 
  initialAddress = emptyAddress 
}: AddressInformationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<AddressFormValues>(initialAddress || emptyAddress);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddressFormValues, string>>>({});
  
  // State for the effective userId (from props or auth)
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(providedUserId || null);
  
  // Auth state loading
  const [authLoading, setAuthLoading] = useState(!providedUserId);
  
  // Initialize with empty or provided address
  const [savedAddress, setSavedAddress] = useState<AddressFormValues>(
    initialAddress || emptyAddress
  );
  
  // Add loading state to show feedback when saving
  const [isSaving, setIsSaving] = useState(false);
  
  // Add error state for displaying form submission errors
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get current user from Firebase Auth if userId is not provided
  useEffect(() => {
    if (providedUserId) {
      setEffectiveUserId(providedUserId);
      setAuthLoading(false);
      return;
    }
    
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEffectiveUserId(user.uid);
        // Try to load user's address if not provided
        if (!initialAddress || Object.values(initialAddress).every(v => !v)) {
          loadUserAddress(user.uid);
        }
      } else {
        setEffectiveUserId(null);
      }
      setAuthLoading(false);
    });
    
    return () => unsubscribe(); // Clean up the subscription
  }, [providedUserId, initialAddress]);

  // Function to load address data from Firestore
  const loadUserAddress = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().address) {
        const addressData = userDoc.data().address as AddressFormValues;
        setSavedAddress(addressData);
        setFormData(addressData);
      }
    } catch (error) {
      console.error("Error loading user address:", error);
    }
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AddressFormValues, string>> = {};
    
    if (!formData.region) {
      errors.region = "Region is required";
    }
    
    if (!formData.province) {
      errors.province = "Province is required";
    }
    
    if (formData.province && locationHierarchy[formData.region]) {
      const hasCities = locationHierarchy[formData.region]?.cities[formData.province]?.length > 0;
      const hasMunicipalities = locationHierarchy[formData.region]?.municipalities[formData.province]?.length > 0;
      
      if ((hasCities || hasMunicipalities) && !formData.city && !formData.municipality) {
        errors.city = "City or Municipality is required";
      }
    }
    
    if ((formData.city || formData.municipality) && !formData.zipCode) {
      errors.zipCode = "ZIP code is required";
    } else if (formData.zipCode && !/^\d{4}$/.test(formData.zipCode)) {
      errors.zipCode = "A valid ZIP code is required";
    }
    
    if (!formData.streetAddress) {
      errors.streetAddress = "Street address is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update available provinces when region changes
  useEffect(() => {
    if (formData.region && locationHierarchy[formData.region]) {
      const provinces = locationHierarchy[formData.region].provinces;
      setAvailableProvinces([...provinces].sort());
    }
  }, [formData.region]);

  // Update cities and municipalities when province changes
  useEffect(() => {
    if (formData.region && formData.province) {
      const regionData = locationHierarchy[formData.region];
      
      // Update cities
      if (regionData?.cities[formData.province]) {
        const cities = regionData.cities[formData.province];
        setAvailableCities([...cities].sort());
      } else {
        setAvailableCities([]);
      }
      
      // Update municipalities
      if (regionData?.municipalities[formData.province]) {
        const municipalities = regionData.municipalities[formData.province];
        setAvailableMunicipalities([...municipalities].sort());
      } else {
        setAvailableMunicipalities([]);
      }
    }
  }, [formData.province, formData.region]);

  // Update ZIP code when city changes
  useEffect(() => {
    if (formData.city && formData.region) {
      // Safely access cityZipCodes with optional chaining
      const zipCode = locationHierarchy[formData.region]?.cityZipCodes?.[formData.city];
      if (zipCode) {
        setFormData(prev => ({ ...prev, zipCode }));
      }
    }
  }, [formData.city, formData.region]);

  // Update ZIP code when municipality changes
  useEffect(() => {
    if (formData.municipality && formData.region) {
      // Safely access municipalityZipCodes with optional chaining
      const zipCode = locationHierarchy[formData.region]?.municipalityZipCodes?.[formData.municipality];
      if (zipCode) {
        setFormData(prev => ({ ...prev, zipCode }));
      }
    }
  }, [formData.municipality, formData.region]);

  const handleInputChange = (field: keyof AddressFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for the field being changed
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegionChange = (value: string) => {
    // Save the current street address
    const streetAddress = formData.streetAddress;
    
    // Update with new region and clear dependent fields
    setFormData({
      ...formData,
      region: value,
      province: "",
      city: "",
      municipality: "",
      zipCode: "",
      streetAddress
    });
    
    // Clear errors for the region field
    if (formErrors.region) {
      setFormErrors(prev => ({ ...prev, region: undefined }));
    }
  };

  const handleProvinceChange = (value: string) => {
    // Update province and clear dependent fields
    setFormData(prev => ({
      ...prev,
      province: value,
      city: "",
      municipality: "",
      zipCode: ""
    }));
    
    // Clear errors for the province field
    if (formErrors.province) {
      setFormErrors(prev => ({ ...prev, province: undefined }));
    }
  };

  const handleCityChange = (value: string) => {
    // Update city and clear municipality
    setFormData(prev => ({
      ...prev,
      city: value,
      municipality: "",
      zipCode: "" // Will be filled by useEffect
    }));
    
    // Clear errors for the city field
    if (formErrors.city) {
      setFormErrors(prev => ({ ...prev, city: undefined }));
    }
  };

  const handleMunicipalityChange = (value: string) => {
    // Update municipality and clear city
    setFormData(prev => ({
      ...prev,
      municipality: value,
      city: "",
      zipCode: "" // Will be filled by useEffect
    }));
    
    // Clear errors for the municipality field
    if (formErrors.municipality) {
      setFormErrors(prev => ({ ...prev, municipality: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setSubmitError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Check if user is authenticated
    if (!effectiveUserId) {
      setSubmitError("You need to be logged in to save your address. Please log in and try again.");
      return;
    }
    
    try {
      console.log("Attempting to save address:", formData);
      setIsSaving(true);
      
      // Create address object
      const addressData = {
        streetAddress: formData.streetAddress,
        region: formData.region,
        province: formData.province,
        city: formData.city || "",
        municipality: formData.municipality || "",
        zipCode: formData.zipCode || ""
      };
      
      console.log("Address data to save:", addressData);
      console.log("User ID:", effectiveUserId);
      
      // Update Firestore document
      const userDocRef = doc(db, "users", effectiveUserId);
      
      // Check if the document exists
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        // Document exists, update it
        await setDoc(userDocRef, { 
          address: addressData
        }, { merge: true });
        console.log("Address saved by updating existing document");
      } else {
        // Document doesn't exist, create it
        await setDoc(userDocRef, {
          id: effectiveUserId,
          address: addressData
        });
        console.log("Address saved by creating new document");
      }

      // Update local state
      setSavedAddress(formData);
      setIsEditing(false);
      console.log("Address successfully saved and UI updated");
    } catch (error: unknown) {
      console.error("Error updating address:", error);
      
      let errorMessage = "Failed to update address. Please try again.";
      
      if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        const firebaseError = error as { code: string; message: string };
        errorMessage = `Error: ${firebaseError.code} - ${firebaseError.message}`;
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setSubmitError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    // Reset form to empty state
    setFormData(emptyAddress);
    
    // Reset available options
    setAvailableProvinces([]);
    setAvailableCities([]);
    setAvailableMunicipalities([]);
    
    // Clear any errors
    setFormErrors({});
    setSubmitError(null);
  };
  
  const handleCancel = () => {
    // Revert form to last saved state
    setFormData(savedAddress);
    setIsEditing(false);
    
    // Clear any errors
    setFormErrors({});
    setSubmitError(null);
  };

  // Show login message if no userId
  if (!authLoading && !effectiveUserId) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-[#2A69AC] mb-4">ADDRESS INFORMATION</h3>
          <p className="text-[#1A365D] mb-4">You need to be logged in to view and edit your address information.</p>
          <Button className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#2A69AC]">ADDRESS</h3>
        </div>
        <div className="py-6 text-center">
          <p className="text-[#718096]">Loading address information...</p>
        </div>
      </div>
    );
  }

  // Memoized display values to improve performance
  const displayCity = savedAddress?.city || savedAddress?.municipality || "-";

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#2A69AC]">ADDRESS</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="text-[#1A365D] hover:text-[#2A69AC] hover:bg-[#EBF8FF]"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>

        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-[#8B909A]">Region</dt>
            <dd className="text-[#1A365D]">{savedAddress?.region || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Province</dt>
            <dd className="text-[#1A365D]">{savedAddress?.province || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">City/Municipality</dt>
            <dd className="text-[#1A365D]">{displayCity}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Zip Code</dt>
            <dd className="text-[#1A365D]">{savedAddress?.zipCode || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#8B909A]">Street Address</dt>
            <dd className="text-[#1A365D]">{savedAddress?.streetAddress || "-"}</dd>
          </div>
        </dl>
      </div>
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{submitError}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="region" className="text-sm font-medium">
                Region
              </label>
              <Select 
                onValueChange={handleRegionChange}
                value={formData.region}
              >
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {philippineRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.region && (
                <p className="text-sm text-red-500 mt-1">{formErrors.region}</p>
              )}
            </div>

            <div>
              <label htmlFor="province" className="text-sm font-medium">
                Province
              </label>
              <Select
                onValueChange={handleProvinceChange}
                value={formData.province}
                disabled={availableProvinces.length === 0}
              >
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="Select Province" />
                </SelectTrigger>
                <SelectContent>
                  {availableProvinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.province && (
                <p className="text-sm text-red-500 mt-1">{formErrors.province}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="text-sm font-medium">
                  City
                </label>
                <Select
                  onValueChange={handleCityChange}
                  value={formData.city || ""}
                  disabled={availableCities.length === 0}
                >
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.city && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="municipality" className="text-sm font-medium">
                  Municipality
                </label>
                <Select
                  onValueChange={handleMunicipalityChange}
                  value={formData.municipality || ""}
                  disabled={availableMunicipalities.length === 0}
                >
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Select Municipality" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMunicipalities.map((municipality) => (
                      <SelectItem key={municipality} value={municipality}>
                        {municipality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="zipCode" className="text-sm font-medium">
                ZIP Code
              </label>
              <Input
                id="zipCode"
                placeholder="ZIP Code"
                className="bg-white/50"
                readOnly
                value={formData.zipCode || ""}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
              />
              <p className="text-xs text-gray-500">ZIP code is automatically determined by city/municipality selection</p>
              {formErrors.zipCode && (
                <p className="text-sm text-red-500 mt-1">{formErrors.zipCode}</p>
              )}
            </div>

            <div>
              <label htmlFor="streetAddress" className="text-sm font-medium">
                House No. & Street, Subdivision/Barangay
              </label>
              <Input
                id="streetAddress"
                placeholder="Enter street address"
                className="bg-white/50"
                value={formData.streetAddress}
                onChange={(e) => handleInputChange("streetAddress", e.target.value)}
              />
              {formErrors.streetAddress && (
                <p className="text-sm text-red-500 mt-1">{formErrors.streetAddress}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-[#EA5455] text-[#EA5455] hover:bg-[#EA5455]/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="border-[#718096] text-[#718096] hover:bg-[#718096]/10"
              >
                <XIcon className="mr-2 h-4 w-4" /> Clear
              </Button>
              <Button 
                type="submit" 
                className="bg-[#1E4E8C] text-white hover:bg-[#1A365D]"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}