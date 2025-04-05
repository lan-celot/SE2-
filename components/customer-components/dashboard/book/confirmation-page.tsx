"use client";

import { useRouter } from "next/navigation"
import { Button } from "@/components/customer-components/ui/button"
import { useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"

// Updated to match Firestore document structure
interface BookingData {
  id: string;
  createdAt?: any; // Can be Firestore timestamp or string
  carModel?: string;
  reservationDate?: string;
  userId?: string;
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
              userId: data.userId
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
            reservationDate: b.reservationDate || 'undefined'
          })));
          
          // Take the most recent booking regardless of other criteria
          if (allBookings.length > 0) {
            const mostRecentBooking = allBookings[0];
            console.log("Using most recent booking:", mostRecentBooking.id);
            setReservationId(mostRecentBooking.id);
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
            {formData.generalServices.map((service: string) => (
              <span key={service} className="px-2 py-1 bg-[#ebf8ff] text-[#1e4e8c] rounded-md text-sm">
                {service.split("_").join(" ").toUpperCase()}
              </span>
            ))}
          </div>
        </div>

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