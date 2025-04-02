import { NavBar } from "@/components/customer-components/nav-bar"
import { HeroSection } from "@/components/customer-components/hero-section"
import { ServicesSection } from "@/components/customer-components/services-section"
import { CarModels } from "@/components/customer-components/car-models"
import { ExoticCarModels } from "@/components/customer-components/exotic-car-models"
import { BookingSection } from "@/components/customer-components/booking-section"
import { BrandLogoScroll } from "@/components/customer-components/brand-logo-scroll"
import { AboutUsSection } from "@/components/customer-components/about-us-section"
import { FAQSection as FAQSection } from "@/components/customer-components/faq-section"
import { Footer } from "@/components/customer-components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#ebf8ff]">
      <NavBar />
      <div className="space-y-24">
        {" "}
        {/* Add spacing between unrelated sections */}
        <HeroSection />
        <ServicesSection />
        <div className="space-y-0">
          {" "}
          {/* No spacing between related car model sections */}
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

