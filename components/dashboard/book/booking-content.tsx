"use client";

import { useState } from "react";
import { PersonalDetailsForm } from "@/components/dashboard/book/personal-details-form";
import { CarDetailsForm } from "@/components/dashboard/book/car-details-form";
import { DateSelectionForm } from "@/components/dashboard/book/date-selection-form";
import { ReviewDetails } from "@/components/dashboard/book/review-details";
import { ConfirmationPage } from "@/components/dashboard/book/confirmation-page";
import { cn } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";

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

  const handleNext = async (data: Partial<FormData>) => {
    if (isSubmitting) return; // Prevent multiple submissions
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

        // Format reservation date to ISO
        const formattedReservationDate = new Date(updatedFormData.reservationDate).toISOString();

        // Prepare services array
        const services = updatedFormData.generalServices.map((serviceId, index) => ({
          mechanic: "TO BE ASSIGNED",
          service: serviceId,
          createdAt: new Date().toISOString(),
          reservationId: `RES-${index + 1}`,
          reservationDate: formattedReservationDate,
        }));

        // Prepare booking data
        const bookingData = {
          ...updatedFormData,
          reservationDate: formattedReservationDate,
          referenceNumber: `R${Math.floor(Math.random() * 1000000)}`,
          createdAt: serverTimestamp(),
          userId: user.uid,
          services,
        };

        // Save to Firestore Global Collection
        const bookingRef = await addDoc(collection(db, "bookings"), bookingData);
        const bookingId = bookingRef.id;

        // Save to User's Subcollection
        await setDoc(doc(db, `users/${user.uid}/bookings`, bookingId), {
          ...bookingData,
          bookingId, // Ensure same ID in user collection
        });

        setCurrentStep(5);
      } catch (error) {
        console.error("Error saving booking: ", error);
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
          />
        )}
        {currentStep === 5 && <ConfirmationPage formData={formData} onBookAgain={handleRestart} />}
      </div>
    </div>
  );
}
