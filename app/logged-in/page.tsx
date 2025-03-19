import { NavBar } from "@/components/nav-bar"
import { LoggedInHeroSection } from "@/components/logged-in-hero-section"
import { ServicesSection } from "@/components/services-section"
import { CarModels } from "@/components/car-models"
import { ExoticCarModels } from "@/components/exotic-car-models"
import { BookingSection } from "@/components/booking-section"
import { BrandLogoScroll } from "@/components/brand-logo-scroll"
import { AboutUsSection } from "@/components/about-us-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/Footer"

export default function LoggedInHome() {
  return (
    <main className="min-h-screen bg-[#ebf8ff]">
      <NavBar isLoggedIn />
      <div className="space-y-24">
        <LoggedInHeroSection />
        <ServicesSection />
        <div className="space-y-0">
          <CarModels />
          <ExoticCarModels />
        </div>
        <BookingSection />
        <BrandLogoScroll />
        <AboutUsSection />
        <FAQSection />
      </div>
      <Footer />
    </main>
  )
}

