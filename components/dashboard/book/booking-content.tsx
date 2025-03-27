"use client";

import { useState } from "react";
import { PersonalDetailsForm } from "@/components/dashboard/book/personal-details-form";
import { CarDetailsForm } from "@/components/dashboard/book/car-details-form";
import { DateSelectionForm } from "@/components/dashboard/book/date-selection-form";
import { ReviewDetails } from "@/components/dashboard/book/review-details";
import { ConfirmationPage } from "@/components/dashboard/book/confirmation-page";
import { cn } from "@/lib/utils";

type BookingStep = 1 | 2 | 3 | 4 | 5;

// Update the status type to include "PENDING"
type ReservationStatus = "PENDING" | "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED";

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
  status: ReservationStatus;
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
    // Set initial status to PENDING
    status: "PENDING",
    completionDate: "",
  });

  // Separate function to check if services can be modified
  const canModifyServices = () => {
    // Services can be modified only if status is PENDING or CONFIRMED
    return formData.status === "PENDING" || formData.status === "CONFIRMED";
  };

  const handleNext = (data: Partial<FormData>) => {
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    setCurrentStep((prev) => (prev + 1) as BookingStep);
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
      // Reset to PENDING status
      status: "PENDING",
      completionDate: "",
    });
  };

  const handleReservationSuccess = () => {
    // Optionally, you can modify the status here if needed
    // For now, it remains at PENDING from the initial submission
    setCurrentStep(5);
    setIsSubmitting(false);
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
            onSubmit={handleReservationSuccess}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )}
        {currentStep === 5 && <ConfirmationPage formData={formData} onBookAgain={handleRestart} />}
      </div>
    </div>
  );
}