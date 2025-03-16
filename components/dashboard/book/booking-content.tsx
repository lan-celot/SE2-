"use client";

import { useState } from "react";
import { PersonalDetailsForm } from "@/components/dashboard/book/personal-details-form";
import { CarDetailsForm } from "@/components/dashboard/book/car-details-form";
import { DateSelectionForm } from "@/components/dashboard/book/date-selection-form";
import { ReviewDetails } from "@/components/dashboard/book/review-details";
import { ConfirmationPage } from "@/components/dashboard/book/confirmation-page";
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

type BookingStep = 1 | 2 | 3 | 4 | 5;

interface FormData {
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
  carBrand: string;
  carFullName: string;
  yearModel: string;
  transmission: string;
  fuelType: string;
  odometer: string;
  generalServices: string[];
  specificIssues: string;
  reservationDate: string;
  completionDate: string;
  status: "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED";
  bookingId?: string;
  referenceNumber?: string;
}

export function BookingContent() {
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    gender: "",
    phoneNumber: "",
    dateOfBirth: "",
    streetAddress: "",
    city: "",
    province: "",
    zipCode: "",
    carBrand: "",
    carModel: "",
    carFullName: "",
    yearModel: "",
    transmission: "",
    fuelType: "",
    odometer: "",
    generalServices: [],
    specificIssues: "",
    reservationDate: "",
    status: "CONFIRMED",
    completionDate: "",
  });

  // Convert any date format to YYYY-MM-DD string
  const formatDateToYYYYMMDD = (dateString: string): string => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString;
    }
  };

  const handleNext = async (data: Partial<FormData>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
  
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
  
    if (currentStep === 4) {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No user is logged in");
          setIsSubmitting(false);
          return;
        }
  
        // Normalize dates to YYYY-MM-DD format
        const normalizedReservationDate = formatDateToYYYYMMDD(updatedFormData.reservationDate);
        const normalizedCompletionDate = updatedFormData.completionDate
          ? formatDateToYYYYMMDD(updatedFormData.completionDate)
          : "";
  
        // Check for existing bookings
        const bookingsCollectionRef = collection(db, "bookings");
        const userBookingsQuery = query(
          bookingsCollectionRef,
          where("userId", "==", user.uid),
          where("carFullName", "==", updatedFormData.carFullName),
          where("reservationDate", "==", normalizedReservationDate)
        );
  
        const bookingsSnapshot = await getDocs(userBookingsQuery);
        
        if (!bookingsSnapshot.empty) {
          throw new Error("A booking already exists for this car on the selected date");
        }
  
        // Generate a unique booking ID with a predictable format
        const timestamp = Date.now().toString();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const bookingId = `BK${timestamp}${randomNum}`;
  
        // Generate reference number
        const referenceNumber = `R${timestamp}${Math.floor(Math.random() * 1000)}`;
  
        // Prepare services with consistent date format
        const services = updatedFormData.generalServices.map((serviceId, index) => ({
          mechanic: "TO BE ASSIGNED",
          service: serviceId,
          createdAt: formatDateToYYYYMMDD(new Date().toISOString()),
          reservationId: `${referenceNumber}-${index + 1}`,
          reservationDate: normalizedReservationDate,
        }));
  
        // Prepare booking data
        const bookingData = {
          ...updatedFormData,
          bookingId, // Store the ID in the document itself
          reservationDate: normalizedReservationDate,
          completionDate: normalizedCompletionDate,
          referenceNumber,
          createdAt: serverTimestamp(),
          userId: user.uid,
          services,
        };
  
        // CRITICAL CHANGE: Remove the old approach completely
        // DO NOT use doc(collection(db, "bookings"))
        // DO NOT use bookingRef.id
  
        // Create documents with explicit IDs
        await setDoc(doc(db, "bookings", bookingId), bookingData);
        await setDoc(doc(db, `users/${user.uid}/bookings`, bookingId), bookingData);
  
        console.log(`Created booking with ID: ${bookingId}`);
  
        // Update form data with the new booking ID and reference number
        setFormData({
          ...updatedFormData,
          bookingId,
          referenceNumber,
          reservationDate: normalizedReservationDate,
          completionDate: normalizedCompletionDate,
        });
  
        setCurrentStep(5);
      } catch (error) {
        console.error("Error saving booking: ", error);
        if (error instanceof Error) {
          alert(error.message || "Error saving booking");
        } else {
          alert("Error saving booking");
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep((prev) => (prev + 1) as BookingStep);
      setIsSubmitting(false);
    }
  };
  

  const handleBack = () => {
    setCurrentStep((prev) => (prev - 1) as BookingStep);
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      phoneNumber: "",
      dateOfBirth: "",
      streetAddress: "",
      city: "",
      province: "",
      zipCode: "",
      carBrand: "",
      carModel: "",
      carFullName: "",
      yearModel: "",
      transmission: "",
      fuelType: "",
      odometer: "",
      generalServices: [],
      specificIssues: "",
      reservationDate: "",
      status: "CONFIRMED",
      completionDate: "",
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-[#1e4e8c] text-3xl font-bold text-center mb-2">Book your car service with us!</h1>
      {currentStep < 5 && (
        <p className="text-gray-600 text-center mb-8">Please fill in the form carefully.</p>
      )}
      {currentStep === 5 && (
        <p className="text-gray-600 text-center mb-8">Your booking is confirmed! See you soon.</p>
      )}

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep >= step
                    ? "bg-[#1e4e8c] text-white"
                    : "bg-[#ebf8ff] text-[#1e4e8c] border-2 border-[#1e4e8c]"
                )}
              >
                {step}
              </div>
              {step < 4 && (
                <div className={cn("h-1 w-16 mx-2", currentStep > step ? "bg-[#1e4e8c]" : "bg-[#ebf8ff]")} />
              )}
            </div>
          ))}
        </div>

        {currentStep === 1 && <PersonalDetailsForm initialData={formData} onSubmit={handleNext} />}
        {currentStep === 2 && <CarDetailsForm initialData={formData} onSubmit={handleNext} onBack={handleBack} />}
        {currentStep === 3 && <DateSelectionForm initialData={formData} onSubmit={handleNext} onBack={handleBack} />}
        {currentStep === 4 && (
          <ReviewDetails
            formData={formData}
            onSubmit={() => {
              if (!isSubmitting) handleNext({});
            }}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )}
        {currentStep === 5 && <ConfirmationPage formData={formData} onBookAgain={handleRestart} />}
      </div>
    </div>
  );
}