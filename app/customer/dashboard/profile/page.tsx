"use client";

import { useState, useEffect } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Pencil, Save, X, Upload, User } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    region: "",
    province: "",
    city: "",
    zipCode: "",
    streetAddress: "",
    photoURL: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log("User is not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const profileRef = doc(db, "accounts", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as any;
        setProfile(profileData);
        setUpdatedProfile(profileData);
      } else {
        console.log("No profile found");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    setUpdatedProfile((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const saveChanges = async (section: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const profileRef = doc(db, "accounts", user.uid);
      await updateDoc(profileRef, updatedProfile);
      setProfile((prev) => ({ ...prev, ...updatedProfile }));

      if (section === 'personal') {
        setEditingPersonal(false);
      } else {
        setEditingAddress(false);
      }
      
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadProfileImage = async () => {
    if (!imageFile || !auth.currentUser) return;
    
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, imageFile);
      const downloadUrl = await getDownloadURL(storageRef);
      
      const profileRef = doc(db, "accounts", auth.currentUser.uid);
      await updateDoc(profileRef, { photoURL: downloadUrl });
      
      setProfile(prev => ({ ...prev, photoURL: downloadUrl }));
      setImageFile(null);
      alert("Profile picture uploaded successfully!");
    } catch (error) {
      console.error("Error uploading profile image:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-lg p-6 shadow-sm h-64"></div>
        <div className="bg-white rounded-lg p-6 shadow-sm h-64"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-0">
      {/* Profile Header with Photo */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-[#3579b8]/20">
              {profile.photoURL || imagePreview ? (
                <img 
                  src={imagePreview || profile.photoURL} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <label 
              htmlFor="profile-upload" 
              className="absolute bottom-0 right-0 bg-[#3579b8] text-white p-2 rounded-full cursor-pointer"
            >
              <Upload className="h-4 w-4" />
            </label>
            <input 
              type="file" 
              id="profile-upload" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-[#1A365D]">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-[#3579b8]">@{profile.username}</p>
            
            {imagePreview && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={uploadProfileImage}
                  disabled={isUploading}
                  className="px-3 py-1 bg-[#3579b8] text-white text-sm rounded-md flex items-center gap-1"
                >
                  {isUploading ? "Uploading..." : "Save Photo"}
                </button>
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Personal Information */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-[#3579b8]">PERSONAL INFORMATION</h3>
          {!editingPersonal ? (
            <button 
              className="text-[#3579b8] hover:bg-blue-50 p-2 rounded-full"
              onClick={() => setEditingPersonal(true)}
            >
              <Pencil className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                className="text-green-600 hover:bg-green-50 p-2 rounded-full"
                onClick={() => saveChanges('personal')}
              >
                <Save className="h-5 w-5" />
              </button>
              <button 
                className="text-red-600 hover:bg-red-50 p-2 rounded-full"
                onClick={() => {
                  setEditingPersonal(false);
                  setUpdatedProfile(profile);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Username</p>
            {editingPersonal ? (
              <input
                type="text"
                value={(updatedProfile as any).username || ""}
                onChange={(e) => handleInputChange('personal', 'username', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{profile.username}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">First Name</p>
            {editingPersonal ? (
              <input
                type="text"
                value={(updatedProfile as any).firstName || ""}
                onChange={(e) => handleInputChange('personal', 'firstName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{profile.firstName}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Last Name</p>
            {editingPersonal ? (
              <input
                type="text"
                value={(updatedProfile as any).lastName || ""}
                onChange={(e) => handleInputChange('personal', 'lastName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{profile.lastName}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Phone Number</p>
            {editingPersonal ? (
              <input
                type="text"
                value={(updatedProfile as any).phoneNumber || ""}
                onChange={(e) => handleInputChange('personal', 'phoneNumber', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{profile.phoneNumber}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Email</p>
            {editingPersonal ? (
              <input
                type="email"
                value={(updatedProfile as any).email || ""}
                onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
                disabled
              />
            ) : (
              <p className="text-[#3579b8]">{profile.email}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Date of Birth</p>
            {editingPersonal ? (
              <input
                type="date"
                value={(updatedProfile as any).dateOfBirth || ""}
                onChange={(e) => handleInputChange('personal', 'dateOfBirth', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{formatDate(profile.dateOfBirth)}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Gender</p>
            {editingPersonal ? (
              <select
                value={(updatedProfile as any).gender || ""}
                onChange={(e) => handleInputChange('personal', 'gender', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHERS">Others</option>
              </select>
            ) : (
              <p className="text-[#3579b8]">{profile.gender}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Address */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-[#3579b8]">ADDRESS</h3>
          {!editingAddress ? (
            <button 
              className="text-[#3579b8] hover:bg-blue-50 p-2 rounded-full"
              onClick={() => setEditingAddress(true)}
            >
              <Pencil className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                className="text-green-600 hover:bg-green-50 p-2 rounded-full"
                onClick={() => saveChanges('address')}
              >
                <Save className="h-5 w-5" />
              </button>
              <button 
                className="text-red-600 hover:bg-red-50 p-2 rounded-full"
                onClick={() => {
                  setEditingAddress(false);
                  setUpdatedProfile(profile);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Region</p>
            {editingAddress ? (
              <input
                type="text"
                value={(updatedProfile as any).region || ""}
                onChange={(e) => handleInputChange('address', 'region', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{profile.region}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Province</p>
            {editingAddress ? (
              <input
                type="text"
                value={(updatedProfile as any).province || ""}
                onChange={(e) => handleInputChange('address', 'province', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{profile.province}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">City/Municipality</p>
            {editingAddress ? (
              <input
                type="text"
                value={(updatedProfile as any).city || ""}
                onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{profile.city}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Zip Code</p>
            {editingAddress ? (
              <input
                type="text"
                value={(updatedProfile as any).zipCode || ""}
                onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{profile.zipCode}</p>
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Street Address</p>
            {editingAddress ? (
              <input
                type="text"
                value={(updatedProfile as any).streetAddress || ""}
                onChange={(e) => handleInputChange('address', 'streetAddress', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            ) : (
              <p className="text-[#3579b8]">{profile.streetAddress}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}