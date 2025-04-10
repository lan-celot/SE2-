// ReviewDetails component with region support added
import React, { useEffect, useState } from "react";
import { Button } from "@/components/customer-components/ui/button";
import { db, auth } from "@/lib/firebase";
import { collection, doc, runTransaction, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import notificationapi from 'notificationapi-node-server-sdk'

interface FormData {
  // Car details
  carBrand: string;
  carModel: string;
  yearModel: string;
  plateNumber: string;
  transmission: string;
  fuelType: string;
  odometer: string;
  
  // Services information
  services: string[]; // Changed from generalServices for consistency
  specificIssues: string;
  needHelp?: boolean;
  helpDescription?: string;
  
  // Personal information
  firstName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  dateOfBirth: string;
  
  // Address information
  streetAddress: string;
  city: string;
  province: string;
  region: string; // Added region field
  zipCode: string;
  
  // Reservation information
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

  //Function to send notification(when confirm booking)
  const sendNotification = async () => {
    try {
      const res = await fetch('/api/user-reserve-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: `${formData.firstName} ${formData.lastName}`,
          commentId: getDisplayCarModel(formData.carBrand, formData.carModel)
        })
      });

      const data = await res.json();
      console.log('Notification status:', data);

    } catch (err) {
      console.error('Client error:', err);
    }
  };

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

  const getDisplayCarModel = (brand: string, model: string): string => {
    const cleanModel = model.replace(brand, '').trim();
    return cleanModel ? `${brand} ${cleanModel}` : model;
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmittingLocal) return;
    setIsSubmittingLocal(true);
  
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to make a reservation");
        setIsSubmittingLocal(false);
        return;
      }
  
      const reservationDate = new Date(formData.reservationDate);
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Manila' };
      const formattedDate = reservationDate.toLocaleDateString('en-CA', options);
  
      const displayCarModel = getDisplayCarModel(formData.carBrand, formData.carModel);
  
      const bookingId = `${user.uid}_${formattedDate}`;
      const bookingRef = doc(db, "bookings", bookingId);
  
      await runTransaction(db, async (transaction) => {
        const existingDoc = await transaction.get(bookingRef);
  
        if (existingDoc.exists()) {
          throw new Error("You already have a reservation for this date.");
        }
  
        const now = new Date();
        const createdDateTime = formatTime(now);
        const normalizedDate = normalizeDate(formData.reservationDate);
  
        // Handle the "need help" scenario by merging helpDescription into specificIssues if needed
        const finalSpecificIssues = formData.needHelp && formData.helpDescription
          ? `${formData.specificIssues || ''}\n\nCustomer needs help: ${formData.helpDescription}`
          : formData.specificIssues;
  
        // Create service objects for the services array
        const serviceObjects = (formData.services || []).map((service) => ({
          service,
          mechanic: "TO BE ASSIGNED",
          status: "Confirmed",
          created: normalizedDate,
          createdTime: createdDateTime,
          reservationDate: normalizedDate,
          serviceId: `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        }));
  
        const bookingData = {
          userId: user.uid,
          carBrand: formData.carBrand,
          carModel: displayCarModel,
          yearModel: formData.yearModel,
          plateNumber: formData.plateNumber,
          transmission: formData.transmission,
          fuelType: formData.fuelType,
          odometer: formData.odometer,
          reservationDate: formattedDate,
          status: "PENDING",
          services: serviceObjects, // Store the service objects directly in services
          specificIssues: finalSpecificIssues,
          firstName: formData.firstName,
          lastName: formData.lastName,
          fullName: `${formData.firstName} ${formData.lastName}`,
          gender: formData.gender,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
          address: `${formData.streetAddress}, ${formData.city}, ${formData.province}, ${formData.region} ${formData.zipCode}`,
          region: formData.region,
          completionDate: "Pending",
          needsAssistance: formData.needHelp || false,
          createdAt: createdDateTime,
          lastUpdated: now.toISOString()
        };
  
        transaction.set(bookingRef, bookingData);
  
        // Add the booking to the user's subcollection
        const userBookingsRef = doc(collection(db, `accounts/${user.uid}/bookings`), bookingId);
        transaction.set(userBookingsRef, bookingData);
        
      });
  
      setSubmissionSuccess(true);
      //calls the notification function
      sendNotification();
    } catch (error: any) {
      console.error("Error submitting reservation:", error);
      alert(error.message || "There was an error submitting your reservation. Please try again.");
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
    return getDisplayCarModel(formData.carBrand, formData.carModel);
  }, [formData.carBrand, formData.carModel]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Review Your Booking</h2>
      <div className="space-y-4">
        {/* Personal Information */}
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
          <p className="font-medium">{`${formData.streetAddress}, ${formData.city}, ${formData.province}, ${formData.region} ${formData.zipCode}`}</p>
        </div>
        
        {/* Reservation & Vehicle Information */}
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
            <p className="text-sm text-gray-500">Plate Number</p>
            <p className="font-medium">{formData.plateNumber}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Transmission</p>
            <p className="font-medium">{formData.transmission}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Fuel Type</p>
            <p className="font-medium">{formData.fuelType}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Odometer</p>
          <p className="font-medium">{formData.odometer}</p>
        </div>
        
        {/* Services Information */}
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Services</p>
          <div className="flex flex-wrap gap-2">
            {formData.needHelp ? (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                Customer needs assistance identifying services
              </span>
            ) : (formData.services || []).length > 0 ? (
              (formData.services || []).map((service: string) => (
                <span key={service} className="px-2 py-1 bg-[#ebf8ff] text-[#1e4e8c] rounded-md text-sm">
                  {service.split("_").join(" ")}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No services selected</span>
            )}
          </div>
        </div>
        
        {/* Issues Description */}
        {(formData.specificIssues || formData.helpDescription) && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              {formData.needHelp ? "Customer Description" : "Specific Issues"}
            </p>
            <p className="text-sm">{formData.specificIssues}</p>
            
            {formData.needHelp && formData.helpDescription && (
              <>
                <p className="text-sm text-gray-500 mt-2">Additional Help Description</p>
                <p className="text-sm">{formData.helpDescription}</p>
              </>
            )}
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