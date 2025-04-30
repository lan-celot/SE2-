// ConfirmationPage component with region support added
"use client";

import { useRouter } from "next/navigation"
import { Button } from "@/components/customer-components/ui/button"
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore"

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to fetch public URLs of uploaded files
const fetchUploadedFiles = async (filePaths: string[]) => {
  try {
    const publicUrls = await Promise.all(
      filePaths.map(async (filePath) => {
        const { data } = supabase.storage.from('car-uploads').getPublicUrl(filePath);
        return data.publicUrl;
      })
    );
    return publicUrls;
  } catch (error) {
    console.error('Error fetching uploaded files:', error);
    return [];
  }
};


// Updated to match Firestore document structure
interface BookingData {
  id: string;
  createdAt?: any; // Can be Firestore timestamp or string
  carModel?: string;
  reservationDate?: string;
  userId?: string;
  region?: string; // Added region field
}

interface ConfirmationPageProps {
  formData: any;
  onBookAgain: () => void;
  bookingId?: string; // Optional direct booking ID if available
}

export function ConfirmationPage({ formData, onBookAgain, bookingId }: ConfirmationPageProps) {

  const router = useRouter();
  const [reservationId, setReservationId] = useState<string>("Loading...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservationId = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const user = auth.currentUser;
        
        if (!user) {
          console.log("User not authenticated");
          setError("Authentication required");
          setIsLoading(false);
          return;
        }

        // Option 1: If we have a direct booking ID, use it
        if (bookingId) {
          console.log("Using provided bookingId:", bookingId);
          const bookingRef = doc(db, "bookings", bookingId);
          const bookingSnap = await getDoc(bookingRef);
          
          if (bookingSnap.exists()) {
            console.log("Found booking with ID:", bookingSnap.id);
            setReservationId(bookingSnap.id);
            
            // Check if we need to update the services format
            const bookingData = bookingSnap.data();
            if (formData.services || formData.generalServices) {
              // Format services to match the expected format in ReservationsTable
              await updateServicesFormat(bookingSnap.id, bookingData, formData);
            }
          } else {
            console.log("Booking document not found with ID:", bookingId);
            setError("Booking not found");
          }
          setIsLoading(false);
          return;
        }
        
        // Option 2: Get the most recent booking
        try {
          console.log("Fetching most recent booking for user:", user.uid);
          const bookingsRef = collection(db, "bookings");
          const q = query(
            bookingsRef,
            where("userId", "==", user.uid)
          );
          
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            console.log("No bookings found for user");
            setError("No bookings available");
            setIsLoading(false);
            return;
          }
          
          // Get all bookings and sort them by createdAt (most recent first)
          const allBookings: BookingData[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              createdAt: data.createdAt,
              carModel: data.carModel,
              reservationDate: data.reservationDate,
              userId: data.userId,
              region: data.region // Added region field
            };
          });
          
          // Sort by createdAt if available, newest first
          allBookings.sort((a, b) => {
            // Handle Firestore timestamps or string dates
            const getTime = (timestamp: any): number => {
              if (!timestamp) return 0;
              
              if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                // Handle Firestore Timestamp
                return timestamp.toDate().getTime();
              }
              
              if (timestamp.seconds && timestamp.nanoseconds) {
                // Handle Firestore Timestamp in a different format
                return new Date(timestamp.seconds * 1000).getTime();
              }
              
              // Handle string dates or other formats
              return new Date(timestamp).getTime();
            };
            
            const timeA = getTime(a.createdAt);
            const timeB = getTime(b.createdAt);
            
            return timeB - timeA;
          });
          
          // For debugging
          console.log("All bookings:", allBookings.map(b => ({
            id: b.id,
            createdAt: b.createdAt ? (typeof b.createdAt === 'object' ? 'timestamp' : b.createdAt) : 'undefined',
            carModel: b.carModel || 'undefined',
            reservationDate: b.reservationDate || 'undefined',
            region: b.region || 'undefined' // Added region for debugging
          })));
          
          // Take the most recent booking regardless of other criteria
          if (allBookings.length > 0) {
            const mostRecentBooking = allBookings[0];
            console.log("Using most recent booking:", mostRecentBooking.id);
            setReservationId(mostRecentBooking.id);
            
            // Get the full booking data
            const bookingRef = doc(db, "bookings", mostRecentBooking.id);
            const bookingSnap = await getDoc(bookingRef);
            
            if (bookingSnap.exists()) {
              const bookingData = bookingSnap.data();
              // Format services to match the expected format in ReservationsTable
              if (formData.services || formData.generalServices) {
                await updateServicesFormat(mostRecentBooking.id, bookingData, formData);
              }
            }
          } else {
            setError("No bookings available");
          }
        } catch (err) {
          console.error("Error in fetching bookings:", err);
          setError("Error fetching bookings");
        }
      } catch (error) {
        console.error("Error in fetchReservationId:", error);
        setError("Error retrieving booking ID");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservationId();
  }, [bookingId, formData]);

  // New function to update services format to match ReservationsTable expectations
  const updateServicesFormat = async (bookingId: string, bookingData: any, formData: any) => {
    try {
      // Get services from either formData.services or formData.generalServices
      const servicesList = formData.services || formData.generalServices || [];
      if (!servicesList.length) return;
      
      // Format the services to match the format expected by ReservationsTable
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Manila' };
      const createdDate = now.toLocaleDateString('en-CA', options);
      const createdTime = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Check if bookingData already has a services array
      const existingServices = Array.isArray(bookingData.services) ? bookingData.services : [];
      
      // Create properly formatted services
      const formattedServices = servicesList.map((service: string) => ({
        mechanic: "TO BE ASSIGNED",
        service: service.split("_").join(" ").toUpperCase(), // Format to match what's shown in the UI
        status: "Confirmed",
        created: createdDate,
        createdTime: createdTime,
        reservationDate: bookingData.reservationDate,
        serviceId: `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      }));
      
      // Update the booking with properly formatted services
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        services: [...existingServices, ...formattedServices],
        status: bookingData.status || "CONFIRMED" // Ensure status is set
      });
      
      console.log("Updated booking services to match expected format");
    } catch (error) {
      console.error("Error updating services format:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        {isLoading ? (
          <h2 className="text-2xl font-bold text-[#1e4e8c] mb-4">Loading...</h2>
        ) : error ? (
          <div>
            <h2 className="text-2xl font-bold text-[#1e4e8c] mb-2">Reservation Created</h2>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        ) : (
          <h2 className="text-2xl font-bold text-[#1e4e8c] mb-4">{reservationId}</h2>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{`${formData.firstName} ${formData.lastName}`}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Car </p>
            <p className="font-medium">{`${formData.carBrand} ${formData.carModel}`}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Year Model</p>
            <p className="font-medium">{formData.yearModel}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Transmission</p>
            <p className="font-medium">{formData.transmission}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Fuel Type</p>
            <p className="font-medium">{formData.fuelType}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Odometer</p>
            <p className="font-medium">{formData.odometer}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Reservation Date</p>
          <p className="font-medium">{new Date(formData.reservationDate).toLocaleDateString()}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">General Services</p>
          <div className="flex flex-wrap gap-2">
            {formData.services ? (
              formData.services.map((service: string) => (
                <span key={service} className="px-2 py-1 bg-[#ebf8ff] text-[#1e4e8c] rounded-md text-sm">
                  {service.split("_").join(" ").toUpperCase()}
                </span>
              ))
            ) : formData.generalServices ? (
              formData.generalServices.map((service: string) => (
                <span key={service} className="px-2 py-1 bg-[#ebf8ff] text-[#1e4e8c] rounded-md text-sm">
                  {service.split("_").join(" ").toUpperCase()}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No services selected</span>
            )}
          </div>
        </div>

        {formData.uploadedFiles && formData.uploadedFiles.length > 0 && (
  <div className="space-y-2 mt-4">
    <h3 className="text-lg font-medium mb-2">Uploaded Files</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {formData.uploadedFiles.map((file: { fileUrl: string | undefined; fileName: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; fileSize: number; }, index: Key | null | undefined) => (
        <div key={index} className="border rounded-md p-4 bg-gray-50">
          <img
            src={file.fileUrl}
            alt={String(file.fileName)}
            className="w-full h-48 object-cover rounded-md mb-2"
          />
          <p className="text-sm text-gray-700">{file.fileName}</p>
          <p className="text-xs text-gray-500">
            {(file.fileSize / 1024).toFixed(2)} KB
          </p>
        </div>
      ))}
    </div>
  </div>
)}


        {formData.specificIssues && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Specific Issues</p>
            <p className="text-sm">{formData.specificIssues}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button onClick={onBookAgain} variant="outline" className="border-[#1e4e8c] text-[#1e4e8c]">
          Book Again
        </Button>
        <Button onClick={() => router.push("/customer/dashboard/reservations")} className="bg-[#1e4e8c] text-white">
          Go to Reservations
        </Button>
      </div>
    </div>
  );
}