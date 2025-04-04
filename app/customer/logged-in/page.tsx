import { NavBar } from "@/components/customer-components/nav-bar"
import { LoggedInHeroSection } from "@/components/customer-components/logged-in-hero-section"
import { ServicesSection } from "@/components/customer-components/services-section"
import { CarModels } from "@/components/customer-components/car-models"
import { ExoticCarModels } from "@/components/customer-components/exotic-car-models"
import { BookingSection } from "@/components/customer-components/booking-section"
import { BrandLogoScroll } from "@/components/customer-components/brand-logo-scroll"
import { AboutUsSection } from "@/components/customer-components/about-us-section"
import { FAQSection } from "@/components/customer-components/faq-section"
import { Footer } from "@/components/customer-components/Footer"

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
      <Footer isLoggedIn={true} />
    </main>
  )
}

