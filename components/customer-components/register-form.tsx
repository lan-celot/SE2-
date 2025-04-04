"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/customer-components/ui/button"
import { Input } from "@/components/customer-components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/customer-components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/customer-components/ui/select"
import { Alert, AlertDescription } from "@/components/customer-components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/customer-components/ui/checkbox"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { db } from "@/lib/firebase"
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { serverTimestamp } from "firebase/firestore"

const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    phoneNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in format: 09XXXXXXXXX"),
    gender: z.enum(["MALE", "FEMALE"]),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-zA-Z0-9]).{8,}$/,
        "Password must contain at least 8 alphanumeric characters and 1 uppercase letter",
      ),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export function RegisterForm() {
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [usernameError, setUsernameError] = React.useState<string | null>(null)
  const [phoneError, setPhoneError] = React.useState<string | null>(null)
  const [emailError, setEmailError] = React.useState<string | null>(null)

  // Debounce timers
  const usernameTimer = React.useRef<NodeJS.Timeout | null>(null)
  const phoneTimer = React.useRef<NodeJS.Timeout | null>(null)
  const emailTimer = React.useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phoneNumber: "",
      gender: undefined,
      dateOfBirth: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  // Clear error message when user interacts with the form
  React.useEffect(() => {
    const subscription = form.watch(() => {
      if (error) setError(null)
    })
    return () => subscription.unsubscribe()
  }, [form, error])

  // Check if username exists in database
  const checkUsername = React.useCallback(async (username: string) => {
    if (username.length < 3) return

    try {
      const usernameQuery = query(collection(db, "accounts"), where("username", "==", username))
      const usernameSnapshot = await getDocs(usernameQuery)

      if (!usernameSnapshot.empty) {
        setUsernameError("Username already exists. Please choose another one.")
      } else {
        setUsernameError(null)
      }
    } catch (err) {
      console.error("Error checking username:", err)
    }
  }, [])

  // Check if phone number exists in database
  const checkPhoneNumber = React.useCallback(async (phoneNumber: string) => {
    if (!phoneNumber.match(/^09\d{9}$/)) return

    try {
      const phoneQuery = query(collection(db, "accounts"), where("phoneNumber", "==", phoneNumber))
      const phoneSnapshot = await getDocs(phoneQuery)

      if (!phoneSnapshot.empty) {
        setPhoneError("Phone number already registered. Please use another one.")
      } else {
        setPhoneError(null)
      }
    } catch (err) {
      console.error("Error checking phone number:", err)
    }
  }, [])

  // Check if email exists in database
  const checkEmail = React.useCallback(async (email: string) => {
    if (!email.includes("@")) return

    try {
      const emailQuery = query(collection(db, "accounts"), where("email", "==", email))
      const emailSnapshot = await getDocs(emailQuery)

      if (!emailSnapshot.empty) {
        setEmailError("Email already registered. Please use another one.")
      } else {
        setEmailError(null)
      }
    } catch (err) {
      console.error("Error checking email:", err)
    }
  }, [])

  // Backend: Handles user registration
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Check for field-specific errors before proceeding
    if (usernameError || phoneError || emailError) {
      return
    }

    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      // Double-check if username, phone, or email already exists
      const usernameQuery = query(collection(db, "accounts"), where("username", "==", values.username))
      const usernameSnapshot = await getDocs(usernameQuery)

      if (!usernameSnapshot.empty) {
        setUsernameError("Username already exists. Please choose another one.")
        setIsLoading(false)
        return
      }

      const phoneQuery = query(collection(db, "accounts"), where("phoneNumber", "==", values.phoneNumber))
      const phoneSnapshot = await getDocs(phoneQuery)

      if (!phoneSnapshot.empty) {
        setPhoneError("Phone number already registered. Please use another one.")
        setIsLoading(false)
        return
      }

      const emailQuery = query(collection(db, "accounts"), where("email", "==", values.email))
      const emailSnapshot = await getDocs(emailQuery)

      if (!emailSnapshot.empty) {
        setEmailError("Email already registered. Please use another one.")
        setIsLoading(false)
        return
      }

      // 1️⃣ Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password)
      const user = userCredential.user

      // 2️⃣ Update user profile
      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`,
      })

      // Format date of birth to match the format in the database
      const dateOfBirth = new Date(values.dateOfBirth).toISOString().split("T")[0]

      // 3️⃣ Save user details to Firestore accounts collection
      const accountData = {
        authUid: user.uid,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        username: values.username,
        phoneNumber: values.phoneNumber,
        gender: values.gender,
        dateOfBirth: dateOfBirth,
        role: "customer",
        termsAccepted: values.terms,
        createdAt: serverTimestamp(),
      }

      // Save to accounts collection
      await setDoc(doc(db, "accounts", user.uid), accountData)

      // Also save to users collection for backward compatibility
      await setDoc(doc(db, "users", user.uid), {
        ...accountData,
        createdAt: new Date().toISOString(), // String format for users collection
      })

      setSuccess(true)
      setIsLoading(false)

      setTimeout(() => {
        router.replace("/admin/login")
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error("Registration Error:", err)

      // Format Firebase error messages to be more user-friendly
      if (err.code === "auth/email-already-in-use") {
        setEmailError("Email already registered. Please use another one.")
      } else if (err.code === "auth/invalid-email") {
        setEmailError("Invalid email address format.")
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.")
      } else {
        setError(err.message)
      }

      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 text-green-600 border-green-200">
          <AlertDescription>Registered successfully! Redirecting to login...</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="First Name" className="bg-white/50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Last Name" className="bg-white/50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Email"
                  className={cn("bg-white/50", emailError && "border-red-500 focus-visible:ring-red-500")}
                  {...field}
                  onBlur={(e) => {
                    field.onBlur()
                    // Clear any existing timer
                    if (emailTimer.current) clearTimeout(emailTimer.current)

                    // Set a new timer to check email after typing stops
                    emailTimer.current = setTimeout(() => {
                      checkEmail(e.target.value)
                    }, 500)
                  }}
                  onChange={(e) => {
                    field.onChange(e)
                    setEmailError(null)

                    // Clear any existing timer
                    if (emailTimer.current) clearTimeout(emailTimer.current)

                    // Set a new timer to check email after typing stops
                    emailTimer.current = setTimeout(() => {
                      checkEmail(e.target.value)
                    }, 500)
                  }}
                />
              </FormControl>
              {emailError ? <p className="text-sm font-medium text-red-500">{emailError}</p> : <FormMessage />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Username"
                  className={cn("bg-white/50", usernameError && "border-red-500 focus-visible:ring-red-500")}
                  {...field}
                  onBlur={(e) => {
                    field.onBlur()
                    // Clear any existing timer
                    if (usernameTimer.current) clearTimeout(usernameTimer.current)

                    // Set a new timer to check username after typing stops
                    usernameTimer.current = setTimeout(() => {
                      checkUsername(e.target.value)
                    }, 500)
                  }}
                  onChange={(e) => {
                    field.onChange(e)
                    setUsernameError(null)

                    // Clear any existing timer
                    if (usernameTimer.current) clearTimeout(usernameTimer.current)

                    // Set a new timer to check username after typing stops
                    usernameTimer.current = setTimeout(() => {
                      checkUsername(e.target.value)
                    }, 500)
                  }}
                />
              </FormControl>
              {usernameError ? <p className="text-sm font-medium text-red-500">{usernameError}</p> : <FormMessage />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Phone Number (09171234567)"
                  className={cn("bg-white/50", phoneError && "border-red-500 focus-visible:ring-red-500")}
                  {...field}
                  onBlur={(e) => {
                    field.onBlur()
                    // Clear any existing timer
                    if (phoneTimer.current) clearTimeout(phoneTimer.current)

                    // Set a new timer to check phone number after typing stops
                    phoneTimer.current = setTimeout(() => {
                      checkPhoneNumber(e.target.value)
                    }, 500)
                  }}
                  onChange={(e) => {
                    field.onChange(e)
                    setPhoneError(null)

                    // Clear any existing timer
                    if (phoneTimer.current) clearTimeout(phoneTimer.current)

                    // Set a new timer to check phone number after typing stops
                    phoneTimer.current = setTimeout(() => {
                      checkPhoneNumber(e.target.value)
                    }, 500)
                  }}
                />
              </FormControl>
              {phoneError ? <p className="text-sm font-medium text-red-500">{phoneError}</p> : <FormMessage />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="date" placeholder="Date of Birth" className="bg-white/50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="bg-white/50 pr-10"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="bg-white/50 pr-10"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm text-gray-600">
                  I have read and agreed to{" "}
                  <Link href="/customer/terms" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Button
            type="submit"
            className="w-full bg-primary text-white"
            disabled={isLoading || !!usernameError || !!phoneError || !!emailError}
          >
            {isLoading ? "Registering..." : "Register"}
          </Button>
          <div className="text-center text-sm">
            <span className="text-gray-600">or </span>
            <Link href="/admin/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}

