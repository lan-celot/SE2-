import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, getDoc, documentId } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface FormData {
  carBrand: string;
  firstName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  dateOfBirth: string;
  streetAddress: string;
  city: string;
  province: string;
  zipCode: string;
  carModel: string;
  yearModel: string;
  transmission: string;
  fuelType: string;
  odometer: string;
  generalServices: string[];
  specificIssues: string;
  reservationDate: string;
}

interface ReviewDetailsProps {
  formData: FormData;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function ReviewDetails({
  formData,
  onBack,
  onSubmit,
  isSubmitting
}: ReviewDetailsProps) {
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const router = useRouter();

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const normalizeDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmittingLocal(true);
  
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to make a reservation");
        setIsSubmittingLocal(false);
        return;
      }

      // Global bookings collection
      const bookingsCollectionRef = collection(db, "bookings");
      
      // Convert reservation date to Philippines time (UTC+8)
      const reservationDate = new Date(formData.reservationDate);
      // Format date to YYYY-MM-DD in Philippines timezone
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Manila' };
      const formattedDate = reservationDate.toLocaleDateString('en-CA', options); // en-CA uses YYYY-MM-DD format

      // Check for existing reservation on the same date
      const existingBookingsQuery = query(
        bookingsCollectionRef,
        where("userId", "==", user.uid),
        where("reservationDate", "==", formattedDate)
      );

      const querySnapshot = await getDocs(existingBookingsQuery);

        if (!querySnapshot.empty) {
          alert("You already have a reservation for this date.");
          setIsSubmittingLocal(false);
          return;
        }
    
        const normalizedDate = normalizeDate(formData.reservationDate);
        const newBookingRef = doc(collection(db, "bookings"));
        const docRef = newBookingRef;
    
        // Check if a document already exists to prevent overwriting
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          alert("You already have a reservation for this date.");
          setIsSubmittingLocal(false);
          return;
        }
    
        const now = new Date();
        const createdDateTime = formatTime(now);
        const displayCarModel = formData.carModel.includes(formData.carBrand)
          ? formData.carModel
          : `${formData.carBrand} ${formData.carModel}`;
    
        const bookingData = {
          userId: user.uid,
          carBrand: formData.carBrand,
          carModel: displayCarModel,
          yearModel: formData.yearModel,
          transmission: formData.transmission,
          fuelType: formData.fuelType,
          odometer: formData.odometer,
          reservationDate: formattedDate,
          status: "CONFIRMED",
          generalServices: formData.generalServices,
          specificIssues: formData.specificIssues,
          firstName: formData.firstName,
          lastName: formData.lastName,
          fullName: `${formData.firstName} ${formData.lastName}`,
          gender: formData.gender,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
          address: `${formData.streetAddress}, ${formData.city}, ${formData.province} ${formData.zipCode}`,
          completionDate: "Pending",
          services: formData.generalServices.map((service) => ({
            service,
            mechanic: "TO BE ASSIGNED",
            status: "Confirmed",
            created: normalizedDate,
            createdTime: createdDateTime,
            reservationDate: normalizedDate,
            serviceId: `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
          })),
          createdAt: createdDateTime,
          lastUpdated: now.toISOString()
        };
    
      await setDoc(docRef, bookingData);
      console.log("Reservation submitted with ID:", documentId);
  
      setSubmissionSuccess(true);
    } catch (error) {
      console.error("Error submitting reservation:", error);
      alert("There was an error submitting your reservation. Please try again.");
    } finally {
      setIsSubmittingLocal(false);
    }
  };
  
  useEffect(() => {
    if (submissionSuccess) {
      onSubmit();
    }
  }, [submissionSuccess, onSubmit]);

  const displayCarModel = React.useMemo(() => {
    if (formData.carModel.includes(formData.carBrand)) {
      return formData.carModel;
    }
    return `${formData.carBrand} ${formData.carModel}`;
  }, [formData.carBrand, formData.carModel]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Review Your Booking</h2>
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{`${formData.firstName} ${formData.lastName}`}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Gender</p>
            <p className="font-medium">{formData.gender}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Phone Number</p>
            <p className="font-medium">{formData.phoneNumber}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p className="font-medium">{formData.dateOfBirth}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Address</p>
          <p className="font-medium">{`${formData.streetAddress}, ${formData.city}, ${formData.province} ${formData.zipCode}`}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Reservation Date</p>
            <p className="font-medium">
              {new Date(formData.reservationDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Car Model</p>
            <p className="font-medium">{displayCarModel}</p>
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
      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onBack} className="border-[#1e4e8c] text-[#1e4e8c]">
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-[#1e4e8c] text-white"
          disabled={isSubmitting || isSubmittingLocal}
        >
          {isSubmitting || isSubmittingLocal ? "Processing..." : "Reserve"}
        </Button>
      </div>
    </div>
  );
}