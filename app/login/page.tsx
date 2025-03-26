"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { loginUser } from "@/lib/firebase"
import { getApp } from "firebase/app"
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const router = useRouter()

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setNotification(null)

    // Basic validation
    if (!email || !password) {
      setNotification({
        type: "error",
        message: "Please enter both email and password",
      })
      setIsLoading(false)
      return
    }

    try {
      // Attempt to login
      const user = await loginUser(email, password)

      // Check if the user's email is in the adminUsers collection
      const db = getFirestore(getApp())
      const adminUsersRef = collection(db, "adminUsers")
      const q = query(adminUsersRef, where("email", "==", user.email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // Show success notification
        setNotification({
          type: "success",
          message: "Redirecting to dashboard...",
        })

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        // Handle unauthorized access
        setNotification({
          type: "error",
          message: "You do not have admin access.",
        })
        setIsLoading(false)
      }
    } catch (error: unknown) {
      // Handle login errors
      console.error("Login error details:", error)

      let errorMessage = "Login failed"

      if (error instanceof Error) {
        // Check for specific Firebase error codes
        if (error.message.includes("auth/invalid-credential")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again."
        } else if (error.message.includes("auth/user-not-found")) {
          errorMessage = "No account found with this email address."
        } else if (error.message.includes("auth/wrong-password")) {
          errorMessage = "Incorrect password. Please try again."
        } else if (error.message.includes("auth/user-disabled")) {
          errorMessage = "This account has been disabled. Please contact support."
        } else if (error.message.includes("auth/too-many-requests")) {
          errorMessage = "Too many unsuccessful login attempts. Please try again later."
        } else {
          errorMessage = error.message
        }
      }

      setNotification({
        type: "error",
        message: errorMessage,
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#ebf8ff] flex flex-col">
      {notification && (
        <div
          className={`fixed inset-x-0 top-0 z-50 p-4 text-center ${
            notification.type === "success" ? "bg-[#E6FFF3] text-[#28C76F]" : "bg-[#FFE6E6] text-[#EA5455]"
          }`}
        >
          {notification.message}
        </div>
      )}

      <header className="p-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/marnor_logooo-i719G89p6MTFfgH5UIC2R69vG0Fkfs.svg"
            alt="MAR & NOR AUTO REPAIR"
            width={35}
            height={27}
            className="h-6 w-auto"
          />
          <span className="text-[#1E4E8C] font-bold">MAR & NOR AUTO REPAIR</span>
        </Link>
      </header>

      <main className="flex-1 grid lg:grid-cols-2 gap-8 items-center p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center lg:items-start mx-auto w-full max-w-[500px]">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 lg:hidden text-center lg:text-left">
            <span className="text-[#2A69AC]">Return </span>
            <span className="text-[#1A365D]">to the Pit!</span>
          </h1>
          <form onSubmit={handleLogin} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg w-full">
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
              }}
              className="h-12 text-base placeholder:text-gray-400"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                className="h-12 pr-10 text-base placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Button type="submit" className="h-12 w-full bg-[#2A69AC] hover:bg-[#1A365D]" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center mt-4"></div>
          </form>
        </div>
        <div className="hidden lg:flex flex-col items-start justify-center">
          <h1 className="text-7xl font-bold mb-6">
            <span className="text-[#2A69AC]">Return </span>
            <span className="text-[#1A365D]">to the Pit!</span>
          </h1>
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/adminlogincar-LniPM2lU7jZPwXx6LuWaacyBHBasLV.svg"
              alt="Blue BMW Z4"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </main>
    </div>
  )
} 