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
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import { getAuth, sendPasswordResetEmail } from "firebase/auth"
import Cookies from "js-cookie"
import { Checkbox } from "@/components/admin-components/checkbox"
import { logUserLogin } from "@/lib/log-utils"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetCooldownEnd, setResetCooldownEnd] = useState<number | null>(null)
  const [resetAttempts, setResetAttempts] = useState(0)
  const [resetLinkSent, setResetLinkSent] = useState(false)
  const [resetTimeRemaining, setResetTimeRemaining] = useState<number | null>(null)
  // Add a render trigger state to force updates
  const [timerTick, setTimerTick] = useState(0)
  const router = useRouter()

  // Constants for cooldown times
  const RESET_TIMEOUT = 3 * 60 * 1000 // 3 minutes in milliseconds
  const INITIAL_COOLDOWN = 5 * 60 * 1000 // 5 minutes in milliseconds
  const LONG_COOLDOWN = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
  const MAX_ATTEMPTS = 3 // Max attempts before cooldown

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Load cooldown data from localStorage on mount
  useEffect(() => {
    const storedCooldownEnd = localStorage.getItem("resetCooldownEnd")
    const storedAttempts = localStorage.getItem("resetAttempts")
    const storedTimeRemaining = localStorage.getItem("resetTimeRemaining")
    const storedLinkSent = localStorage.getItem("resetLinkSent")

    if (typeof window !== "undefined") {
      if (storedCooldownEnd) {
        const cooldownEndTime = Number.parseInt(storedCooldownEnd)
        // Only set the cooldown if it hasn't expired yet
        if (cooldownEndTime > Date.now()) {
          setResetCooldownEnd(cooldownEndTime)
        } else {
          // If cooldown has expired, remove it from localStorage
          localStorage.removeItem("resetCooldownEnd")
        }
      }

      if (storedAttempts) {
        setResetAttempts(Number.parseInt(storedAttempts))
      }

      if (storedTimeRemaining) {
        const expiryTime = Number.parseInt(storedTimeRemaining)
        if (expiryTime > Date.now()) {
          setResetTimeRemaining(expiryTime)
          setResetLinkSent(storedLinkSent === "true")
        } else {
          localStorage.removeItem("resetTimeRemaining")
          localStorage.removeItem("resetLinkSent")
        }
      }
    }
  }, [])

  // Timer effect for countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (resetTimeRemaining && resetLinkSent) {
      // Set up interval to update the timer every second
      interval = setInterval(() => {
        const now = Date.now()

        // Check if timer has expired
        if (resetTimeRemaining <= now) {
          // Timer expired, clean up
          setResetTimeRemaining(null)
          setResetLinkSent(false)
          localStorage.removeItem("resetTimeRemaining")
          localStorage.removeItem("resetLinkSent")

          if (interval) clearInterval(interval)
        } else {
          // Timer still active, increment tick to force re-render
          setTimerTick((prev) => prev + 1)
        }
      }, 1000)
    }

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [resetTimeRemaining, resetLinkSent])

  // Helper function to format time
  const formatTimeRemaining = (milliseconds: number): string => {
    const seconds = Math.floor((milliseconds / 1000) % 60)
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60)
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

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

          // Log user login
          await logUserLogin(firstName, userEmail, uid)

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
              router.push("/customer/dashboard")
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

            // Log user login
            await logUserLogin("Admin", userEmail, uid)

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResetLoading(true)
    setNotification(null)

    // Check if user is in cooldown period
    if (resetCooldownEnd && Date.now() < resetCooldownEnd) {
      const remainingTime = resetCooldownEnd - Date.now()
      setNotification({
        type: "error",
        message: `Please try again in ${formatTimeRemaining(remainingTime)}.`,
      })
      setIsResetLoading(false)
      return
    }

    // Basic validation
    if (!resetEmail) {
      setNotification({
        type: "error",
        message: "Please enter your email address",
      })
      setIsResetLoading(false)
      return
    }

    try {
      const auth = getAuth(getApp())
      const db = getFirestore(getApp())

      // 1. Check if the email exists in our system
      const accountsRef = collection(db, "accounts")
      const emailQuery = query(accountsRef, where("email", "==", resetEmail))
      const emailSnapshot = await getDocs(emailQuery)

      if (emailSnapshot.empty) {
        // Email not found in our system
        throw new Error("user-not-found")
      }

      // 2. Send password reset email
      await sendPasswordResetEmail(auth, resetEmail)

      // 3. Store the reset attempt in Firestore with a timestamp
      const resetAttemptsRef = doc(db, "passwordResetAttempts", resetEmail)
      await setDoc(
        resetAttemptsRef,
        {
          email: resetEmail,
          timestamp: Timestamp.now(),
          expiresAt: Timestamp.fromMillis(Date.now() + RESET_TIMEOUT),
        },
        { merge: true },
      )

      // 4. Show success message with timeout information
      setNotification({
        type: "success",
        message: `Password reset email sent. You have 3 minutes to complete the password reset.`,
      })

      // Set timer state to show countdown
      const expiryTime = Date.now() + RESET_TIMEOUT
      setResetTimeRemaining(expiryTime)
      setResetLinkSent(true)

      // Store in localStorage
      localStorage.setItem("resetTimeRemaining", expiryTime.toString())
      localStorage.setItem("resetLinkSent", "true")

      // 5. Set up a timeout to check if the user has reset their password
      setTimeout(async () => {
        try {
          // Get the reset attempt document
          const resetDoc = await getDoc(resetAttemptsRef)

          if (resetDoc.exists()) {
            const resetData = resetDoc.data()

            // If the reset was not completed (there would be a 'completed' field if it was)
            if (!resetData.completed) {
              // Increment the failed attempts
              const newAttempts = resetAttempts + 1
              setResetAttempts(newAttempts)
              localStorage.setItem("resetAttempts", newAttempts.toString())

              // Clear the reset timer state
              setResetTimeRemaining(null)
              setResetLinkSent(false)
              localStorage.removeItem("resetTimeRemaining")
              localStorage.removeItem("resetLinkSent")

              // Set cooldown if necessary
              if (newAttempts >= MAX_ATTEMPTS) {
                const cooldownTime = newAttempts === MAX_ATTEMPTS ? INITIAL_COOLDOWN : LONG_COOLDOWN
                const cooldownEndTime = Date.now() + cooldownTime
                setResetCooldownEnd(cooldownEndTime)
                localStorage.setItem("resetCooldownEnd", cooldownEndTime.toString())

                // Notify the user about the cooldown if they're still on the page
                setNotification({
                  type: "error",
                  message: `Password reset timed out. Too many failed attempts. Try again in ${formatTimeRemaining(cooldownTime)}.`,
                })
              } else {
                // Just notify about the timeout if they're still on the page
                setNotification({
                  type: "error",
                  message: `Password reset timed out. You have ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`,
                })
              }

              // Update the reset document to show it expired
              await setDoc(
                resetAttemptsRef,
                {
                  expired: true,
                },
                { merge: true },
              )
            }
          }
        } catch (error) {
          console.error("Error checking reset status:", error)
        }
      }, RESET_TIMEOUT)
    } catch (error) {
      console.error("Error sending password reset email:", error)

      // More specific error message for user
      let errorMessage = "An error occurred while sending the password reset email."
      if (error instanceof Error) {
        // Check for common Firebase auth errors
        if (error.message.includes("user-not-found")) {
          errorMessage = "No account found with this email address."
        } else if (error.message.includes("invalid-email")) {
          errorMessage = "Please enter a valid email address."
        }
      }

      setNotification({
        type: "error",
        message: errorMessage,
      })
    } finally {
      setIsResetLoading(false)
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

          {!showResetForm ? (
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Keep me logged in
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className="text-sm text-[#2A69AC] hover:text-[#1A365D] font-medium transition-colors"
                >
                  Forgot Password?
                </button>
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
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg w-full">
              <h2 className="text-2xl font-semibold text-[#1A365D] text-center">Reset Your Password</h2>

              {resetLinkSent && resetTimeRemaining ? (
                <>
                  <div className="bg-[#E6FFF3] border border-[#28C76F] text-[#28C76F] p-4 rounded-lg">
                    <p className="font-medium text-center">Password Reset Email Sent</p>
                    <div className="mt-3 flex flex-col items-center">
                      <div className="text-3xl font-bold">
                        {formatTimeRemaining(resetTimeRemaining - Date.now())}
                        {/* Hidden span with timerTick to force re-render */}
                        <span className="hidden">{timerTick}</span>
                      </div>
                      <p className="mt-2 text-sm text-center">
                        Please check your email and click the reset link. You have the time shown above to complete the
                        password reset.
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 text-center mt-2">
                    Didn't receive the email? Check your spam folder or try again after the timer expires.
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Enter your email address and we'll send you a link to reset your password. You will have 3 minutes
                    to complete the password reset process.
                  </p>

                  {resetCooldownEnd && Date.now() < resetCooldownEnd ? (
                    <div className="bg-[#FFEBCC] border border-[#F99D25] text-[#F99D25] p-4 rounded-lg text-sm">
                      <p className="font-medium">Too many failed attempts</p>
                      <p className="mt-1">Please try again in {formatTimeRemaining(resetCooldownEnd - Date.now())}</p>
                      <p className="mt-2 text-xs">
                        For security reasons, we limit the number of failed password reset attempts.
                      </p>
                    </div>
                  ) : (
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value)
                      }}
                      className="h-12 text-base placeholder:text-gray-400"
                    />
                  )}
                </>
              )}

              <div className="flex space-x-4">
                <Button
                  type="button"
                  className="h-12 flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
                  onClick={() => {
                    setShowResetForm(false)
                    if (resetLinkSent) {
                      // If we go back to login while a reset is in progress, keep the timer running
                      // but don't show success notification again
                    }
                  }}
                  disabled={isResetLoading}
                >
                  Back to Login
                </Button>
                {!resetLinkSent && (
                  <Button
                    type="submit"
                    className="h-12 flex-1 bg-[#2A69AC] hover:bg-[#1A365D]"
                    disabled={isResetLoading || (!!resetCooldownEnd && Date.now() < resetCooldownEnd)}
                  >
                    {isResetLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                )}
              </div>

              {resetAttempts > 0 &&
                resetAttempts < MAX_ATTEMPTS &&
                !(resetCooldownEnd && Date.now() < resetCooldownEnd) &&
                !resetLinkSent && (
                  <div className="text-xs text-gray-500 text-center">
                    You have {MAX_ATTEMPTS - resetAttempts} attempt(s) remaining before temporary lockout.
                  </div>
                )}
            </form>
          )}
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
