"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react" // Added import for React

interface NavBarProps {
  isLoggedIn?: boolean
}

export function NavBar({ isLoggedIn = false }: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
    setIsMenuOpen(false)
  }

  const handleLogout = () => {
    // In a real app, you would clear the authentication token here
    // For example:
    // localStorage.removeItem('authToken');
    // Or make an API call to invalidate the session on the server

    // Redirect to the homepage
    router.push("/")
  }

  return (
    <nav className="bg-[#ebf8ff] sticky top-0 z-50 border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href={isLoggedIn ? "/logged-in" : "/"} className="flex-shrink-0 flex items-center gap-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IvHIqsnbZo32MpjL3mD01Urzi5xkwE.svg"
                alt="MAR & NOR Logo"
                width={41}
                height={25}
                className="h-6 w-auto"
              />
              <span className="text-primary font-bold text-base md:text-l whitespace-nowrap">
                MAR & NOR AUTO REPAIR
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <a
              href="#services"
              onClick={(e) => scrollToSection(e, "services")}
              className="text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              Services
            </a>
            <a
              href="#car-models"
              onClick={(e) => scrollToSection(e, "car-models")}
              className="text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              Car Models
            </a>
            <a
              href="#booking"
              onClick={(e) => scrollToSection(e, "booking")}
              className="text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              Booking
            </a>
            <a
              href="#about"
              onClick={(e) => scrollToSection(e, "about")}
              className="text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              About Us
            </a>
            <a
              href="#faqs"
              onClick={(e) => scrollToSection(e, "faqs")}
              className="text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              FAQs
            </a>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="text-[#2A69AC] hover:text-secondary text-17 font-semibold">
                  Dashboard
                </Link>
                <Button
                  onClick={handleLogout}
                  className="bg-[#2A69AC] text-[#EBF8FF] hover:bg-[#1E4E8C] transition-colors text-lg font-semibold px-6 py-2"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[#2A69AC] hover:text-secondary text-17 font-semibold">
                  Login
                </Link>
                <Link href="/register">
                  <Button className="bg-[#2A69AC] text-[#EBF8FF] hover:bg-[#1E4E8C] transition-colors text-lg font-semibold px-6 py-2">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-primary hover:text-secondary p-2">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#ebf8ff]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="#services"
              onClick={(e) => scrollToSection(e, "services")}
              className="block px-3 py-2 text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              Services
            </a>
            <a
              href="#car-models"
              onClick={(e) => scrollToSection(e, "car-models")}
              className="block px-3 py-2 text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              Car Models
            </a>
            <a
              href="#booking"
              onClick={(e) => scrollToSection(e, "booking")}
              className="block px-3 py-2 text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              Booking
            </a>
            <a
              href="#about"
              onClick={(e) => scrollToSection(e, "about")}
              className="block px-3 py-2 text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              About Us
            </a>
            <a
              href="#faqs"
              onClick={(e) => scrollToSection(e, "faqs")}
              className="block px-3 py-2 text-[#2A69AC] hover:text-secondary cursor-pointer text-17 font-semibold"
            >
              FAQs
            </a>
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-[#2A69AC] hover:text-secondary text-17 font-semibold"
                >
                  Dashboard
                </Link>
                <Link href="/" className="block w-full">
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-[#2A69AC] text-[#EBF8FF] hover:bg-[#1E4E8C] transition-colors text-lg font-semibold px-6 py-2"
                  >
                    Logout
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 text-[#2A69AC] hover:text-secondary text-17 font-semibold"
                >
                  Login
                </Link>
                <Link href="/register" className="block w-full">
                  <Button className="w-full bg-[#2A69AC] text-[#EBF8FF] hover:bg-[#1E4E8C] transition-colors text-lg font-semibold px-6 py-2">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

