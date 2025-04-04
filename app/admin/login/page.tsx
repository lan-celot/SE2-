"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/admin-components/input"
import { Button } from "@/components/admin-components/button"
import Image from "next/image"
import Link from "next/link"
import { loginUser } from "@/lib/firebase"
import { getApp } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import Cookies from "js-cookie"
import { Checkbox } from "@/components/admin-components/checkbox"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
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
    if (!identifier || !password) {
      setNotification({
        type: "error",
        message: "Please enter both identifier and password",
      })
      setIsLoading(false)
      return
    }

    try {
      // Get Firestore instance
      const db = getFirestore(getApp())

      // First, check if the identifier is an email, username, or phone number
      const accountsRef = collection(db, "accounts")

      // Create queries for each possible identifier type
      const emailQuery = query(accountsRef, where("email", "==", identifier))
      const usernameQuery = query(accountsRef, where("username", "==", identifier))
      const phoneQuery = query(accountsRef, where("phoneNumber", "==", identifier))

      // Execute all queries
      const [emailSnapshot, usernameSnapshot, phoneSnapshot] = await Promise.all([
        getDocs(emailQuery),
        getDocs(usernameQuery),
        getDocs(phoneQuery),
      ])

      // Check if any of the queries returned a result
      let userEmail = identifier // Default to using the identifier as email
      let userFound = false

      if (!emailSnapshot.empty) {
        // User found by email
        userEmail = identifier
        userFound = true
      } else if (!usernameSnapshot.empty) {
        // User found by username
        userEmail = usernameSnapshot.docs[0].data().email
        userFound = true
      } else if (!phoneSnapshot.empty) {
        // User found by phone number
        userEmail = phoneSnapshot.docs[0].data().email
        userFound = true
      }

      if (!userFound) {
        setNotification({
          type: "error",
          message: "Account not found. Please check your credentials or register.",
        })
        setIsLoading(false)
        return
      }

      // Now attempt to login with the email
      const result = await loginUser(userEmail, password)

      if (result.success && result.user) {
        // Get the user's UID from the Firebase user object
        const uid = result.user.uid

        if (!uid) {
          throw new Error("User ID not found")
        }

        // Check if user exists in the accounts collection
        const accountRef = doc(db, "accounts", uid)
        const accountSnap = await getDoc(accountRef)

        if (accountSnap.exists()) {
          const userData = accountSnap.data()
          const userRole = userData.role
          const firstName = userData.firstName || "User"

          // Set cookies for authentication and user role
          const expiration = rememberMe ? { expires: 30 } : {}
          Cookies.set("isAuthenticated", "true", expiration)
          Cookies.set("userRole", userRole, expiration)
          Cookies.set("userId", uid, expiration)
          Cookies.set("userFirstName", firstName, expiration)

          // Show success notification
          setNotification({
            type: "success",
            message: `Welcome back, ${firstName}! Redirecting...`,
          })

          // Redirect based on role
          setTimeout(() => {
            if (userRole === "admin") {
              // Admin goes directly to dashboard
              router.push("/admin/dashboard")
            } else {
              // Customer goes to logged-in home page
              router.push("/customer/logged-in")
            }
          }, 2000)
        } else {
          // If not in accounts, check adminUsers collection for backward compatibility
          const adminUsersRef = collection(db, "adminUsers")
          const q = query(adminUsersRef, where("email", "==", userEmail))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            // Set cookies for admin authentication
            const expiration = rememberMe ? { expires: 30 } : {}
            Cookies.set("isAuthenticated", "true", expiration)
            Cookies.set("userRole", "admin", expiration)
            Cookies.set("userId", uid, expiration)
            Cookies.set("userFirstName", "Admin", expiration)

            // Show success notification
            setNotification({
              type: "success",
              message: "Welcome back, Admin! Redirecting to dashboard...",
            })

            // Redirect to admin dashboard
            setTimeout(() => {
              router.push("/admin/dashboard")
            }, 2000)
          } else {
            // Handle unauthorized access
            setNotification({
              type: "error",
              message: "Account not found. Please register first.",
            })
            setIsLoading(false)
          }
        }
      } else {
        // Handle login failure
        setNotification({
          type: "error",
          message: result.error || "Invalid credentials. Please try again.",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error during login:", error)
      setNotification({
        type: "error",
        message: "An error occurred. Please try again.",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#ebf8ff] flex flex-col">
      {notification && (
        <div
          className={`fixed inset-x-0 top-0 z-50 p-4 text-center notification-animate ${
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
              type="text"
              placeholder="Email, Username, or Phone Number"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
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

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Keep me logged in
              </label>
            </div>

            <Button type="submit" className="h-12 w-full bg-[#2A69AC] hover:bg-[#1A365D]" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center mt-4">
              <p className="text-gray-600">
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/customer/register"
                  className="text-[#2A69AC] hover:text-[#1A365D] font-medium transition-colors"
                >
                  Register
                </Link>
              </p>
            </div>
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

