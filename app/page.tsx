import { NavBar } from "@/components/nav-bar"
import { HeroSection } from "@/components/hero-section"
import { ServicesSection } from "@/components/services-section"
import { CarModels } from "@/components/car-models"
import { ExoticCarModels } from "@/components/exotic-car-models"
import { BookingSection } from "@/components/booking-section"
import { BrandLogoScroll } from "@/components/brand-logo-scroll"
import { AboutUsSection } from "@/components/about-us-section"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/Footer"

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

