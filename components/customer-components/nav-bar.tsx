"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/customer-components/ui/button"
import { Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import useLocalStorage from "@/hooks/useLocalStorage"
import { useEffect, useState } from "react"

interface NavBarProps {
  isLoggedIn?: boolean
}

export function NavBar({ isLoggedIn = false }: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useLocalStorage("navMenuState", false)
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  // Get user role from cookie on component mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";")
      const roleCookie = cookies.find((cookie) => cookie.trim().startsWith("userRole="))
      if (roleCookie) {
        const role = roleCookie.split("=")[1]
        setUserRole(role)
      }
    }
  }, [])

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
    // Clear authentication cookies
    document.cookie = "isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    // Redirect to home page
    router.push("/")
    router.refresh() // Force a refresh to update the UI
  }

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (userRole === "admin") {
      return "/admin/dashboard"
    }
    return "/customer/dashboard"
  }

  // Determine home link based on authentication status and user role
  const getHomeLink = () => {
    if (!isLoggedIn) {
      return "/"
    }
    if (userRole === "admin") {
      return "/admin/dashboard"
    }
    return "/customer/logged-in"
  }

  // Handle logo click based on current page
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const currentPath = window.location.pathname

    // If we're already on the home page or logged-in page, just scroll to top
    if (currentPath === "/" || currentPath === "/customer/logged-in") {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    // Otherwise, let the link navigate normally
  }

  return (
    <nav className="bg-[#ebf8ff] sticky top-0 z-50 border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href={getHomeLink()} className="flex-shrink-0 flex items-center gap-2" onClick={handleLogoClick}>
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
                <Link href={getDashboardLink()} className="text-[#2A69AC] hover:text-secondary text-17 font-semibold">
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
                <Link href="/admin/login" className="text-[#2A69AC] hover:text-secondary text-17 font-semibold">
                  Login
                </Link>
                <Link href="/customer/register">
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
                  href={getDashboardLink()}
                  className="block px-3 py-2 text-[#2A69AC] hover:text-secondary text-17 font-semibold"
                >
                  Dashboard
                </Link>
                <Button
                  onClick={handleLogout}
                  className="w-full bg-[#2A69AC] text-[#EBF8FF] hover:bg-[#1E4E8C] transition-colors text-lg font-semibold px-6 py-2"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/admin/login"
                  className="block px-3 py-2 text-[#2A69AC] hover:text-secondary text-17 font-semibold"
                >
                  Login
                </Link>
                <Link href="/customer/register" className="block w-full">
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

