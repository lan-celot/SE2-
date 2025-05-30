"use client";

import { useState } from "react";
import { PersonalDetailsForm } from "@/components/customer-components/dashboard/book/personal-details-form";
import { CarDetailsForm } from "@/components/customer-components/dashboard/book/car-details-form";
import { DateSelectionForm } from "@/components/customer-components/dashboard/book/date-selection-form";
import { ReviewDetails } from "@/components/customer-components/dashboard/book/review-details";
import { ConfirmationPage } from "@/components/customer-components/dashboard/book/confirmation-page";
import { cn } from "@/lib/utils";

type BookingStep = 1 | 2 | 3 | 4 | 5;

// Update the status type to include "PENDING"
type ReservationStatus = "PENDING" | "CONFIRMED" | "REPAIRING" | "COMPLETED" | "CANCELLED";

interface BookingFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  dateOfBirth: string;
  
  // Address Information
  streetAddress: string;
  city: string | null;
  municipality: string | null;
  province: string;
  region: string;
  zipCode: string;
  
  // Car Details
  carBrand: string;
  carModel: string;
  yearModel: string;
  plateNumber: string;
  transmission: string;
  fuelType: string;
  odometer: string;
  
  // Services
  services: string[];
  specificIssues: string;
  needHelp?: boolean;
  helpDescription?: string;
  
  // Reservation
  reservationDate: string;
  status: ReservationStatus;
  completionDate: string;
  
  // Required fields (matching ReviewDetails FormData)
  uploadedFiles: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }>;
}

export function BookingContent() {
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    phoneNumber: "",
    dateOfBirth: "",
    streetAddress: "",
    city: null,
    municipality: null,
    province: "",
    region: "",
    zipCode: "",
    carBrand: "",
    carModel: "",
    yearModel: "",
    plateNumber: "",
    transmission: "",
    fuelType: "",
    odometer: "",
    services: [],
    specificIssues: "",
    needHelp: false,
    helpDescription: "",
    reservationDate: "",
    status: "PENDING",
    completionDate: "",
    uploadedFiles: [], // Initialize with empty array
  });

  // Separate function to check if services can be modified
  const canModifyServices = () => {
    // Services can be modified only if status is PENDING or CONFIRMED
    return formData.status === "PENDING" || formData.status === "CONFIRMED";
  };

  const handleNext = (data: Partial<BookingFormData>) => {
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
      city: null,
      municipality: null,
      province: "",
      region: "",
      zipCode: "",
      carBrand: "",
      carModel: "",
      yearModel: "",
      plateNumber: "",
      transmission: "",
      fuelType: "",
      odometer: "",
      services: [],
      specificIssues: "",
      needHelp: false,
      helpDescription: "",
      reservationDate: "",
      status: "PENDING",
      completionDate: "",
      uploadedFiles: [],
    });
  };

  const handleReservationSuccess = () => {
    // Explicitly set status to PENDING when booking is successful
    setFormData(prev => ({
      ...prev,
      status: "PENDING"
    }));
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

