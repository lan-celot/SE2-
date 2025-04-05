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
import { Eye, EyeOff, X } from "lucide-react"
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
    email: z.string().email("Email Address is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    phoneNumber: z
      .string()
      .regex(/^09\d{9}$/, "Phone number must start with 09 and be exactly 11 digits"),
    gender: z.enum(["MALE", "FEMALE", "OTHERS"]),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((dob) => {
        // Check if date is in the future or invalid
        const dobDate = new Date(dob)
        const currentDate = new Date()

        // Check if date is invalid or in the future
        if (isNaN(dobDate.getTime()) || dobDate > currentDate) {
          return false
        }

        // Calculate age
        const ageDiff = currentDate.getFullYear() - dobDate.getFullYear()
        const monthDiff = currentDate.getMonth() - dobDate.getMonth()
        const dayDiff = currentDate.getDate() - dobDate.getDate()

        // Adjust age if birthday hasn't occurred yet this year
        const age = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? ageDiff - 1 : ageDiff

        // Check if age is at least 18
        return age >= 18
      }, "You must be at least 18 years old to register"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((value) => /[A-Z]/.test(value), "Password must include at least one uppercase letter")
      .refine((value) => /[a-z]/.test(value), "Password must include at least one lowercase letter")
      .refine((value) => /[0-9]/.test(value), "Password must include at least one number")
      .refine(
        (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
        'Password must include at least one special character (!@#$%^&*(),.?":{}|<>)',
      ),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// Terms and conditions content
const termsContent = `TERMS AND CONDITIONS

These Terms of Use, together with our limited warranty (the "Limited Warranty") and privacy policy (the "Privacy Policy"), as well as any rules, policies, terms, and conditions referenced or linked herein, collectively constitute the "Agreement." This Agreement forms a legal contract between you ("you") and Mar and Nor, including its subsidiaries and affiliated brands (hereinafter referred to as "Mar and Nor," "we," or "us"). These Terms govern your access to and use of applications, websites, content, products, programs, and services provided by Mar and Nor (collectively, the "Services"). This Agreement also includes a provision requiring arbitration to resolve any disputes between us. PLEASE READ THESE TERMS CAREFULLY BEFORE ACCESSING OR USING THE SERVICES.

By accessing or using the Services, you agree to be bound by this Agreement. If you do not agree with the Terms, you are not permitted to access or use the Services. These Terms, along with any supplemental terms ("Supplemental Terms") that may apply, override any previous agreements or arrangements between us and take precedence over any other information you may have encountered, whether on our website, in emails, or through other applications. Mar and Nor may terminate this Agreement or any Services related to you at any time, with or without cause, and may also suspend or deny access to the Services, in whole or in part, at its sole discretion.

Supplemental Terms refer to any additional terms or policies specific to a certain Service, including the Mar and Nor Privacy Policy, which are provided with that Service. Supplemental Terms might also include conditions for particular events, activities, programs, or promotions. In the event of a conflict between these Terms and any Supplemental Terms, the Supplemental Terms shall take precedence concerning the applicable Service(s).

Mar and Nor reserves the right to amend these Terms at any time. Such amendments will be effective once posted by Mar and Nor. By continuing to access or use the Services after such postings, you consent to be bound by the revised Terms.

By accessing and using the Services, you confirm and warrant that: (i) you are at least 18 years old and legally recognized as an adult in your jurisdiction, and (ii) you possess the authority and capacity to enter into this Agreement and comply with these Terms. If you are acting on behalf of a company or organization, you represent that you have the authority to bind that entity to this Agreement. The Services are not available to individuals under 18 or to anyone whose account has been terminated. Your account cannot be used to provide Services on behalf of another individual.`

export function RegisterForm() {
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [usernameError, setUsernameError] = React.useState<string | null>(null)
  const [phoneError, setPhoneError] = React.useState<string | null>(null)
  const [emailError, setEmailError] = React.useState<string | null>(null)
  const [showTermsPopup, setShowTermsPopup] = React.useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = React.useState(false)
  const termsContainerRef = React.useRef<HTMLDivElement>(null)
  const [termsContentHeight, setTermsContentHeight] = React.useState(0)

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
    mode: "onChange", // Add this to enable real-time validation
  })

  // Clear error message when user interacts with the form
  React.useEffect(() => {
    const subscription = form.watch(() => {
      if (error) setError(null)
    })
    return () => subscription.unsubscribe()
  }, [form, error])

  // Reset scroll state when popup opens and measure content height
  React.useEffect(() => {
    if (showTermsPopup) {
      setHasScrolledToBottom(false)

      // Use a timeout to ensure the DOM has rendered
      setTimeout(() => {
        if (termsContainerRef.current) {
          // Store the actual content height
          setTermsContentHeight(termsContainerRef.current.scrollHeight)

          // Reset scroll position to top
          termsContainerRef.current.scrollTop = 0
        }
      }, 100)
    }
  }, [showTermsPopup])

  // Handle terms popup scroll event
  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget

    // Check if scrolled to bottom (with a small threshold)
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 5) {
      setHasScrolledToBottom(true)
    }
  }

  // Accept terms and close popup
  const acceptTerms = () => {
    form.setValue("terms", true)
    setShowTermsPopup(false)
  }

  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    // If checkbox is not already checked and user tries to check it directly
    if (!form.getValues().terms) {
      e.preventDefault() // Prevent default checkbox behavior
      setShowTermsPopup(true)
      setHasScrolledToBottom(false)
    }
    // If it's already checked, allow unchecking
  }

  // Check if username exists in database
  const checkUsername = React.useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters")
      return
    }

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

  // Validate email format
  const validateEmail = (email: string) => {
    // Count @ symbols
    const atSymbols = (email.match(/@/g) || []).length
    // Check for .com (case insensitive)
    const hasDotCom = /.com$/i.test(email)
    
    if (email.length === 0) {
      return "Email Address is required"
    } else if (atSymbols === 0) {
      return "Email must contain an @ symbol"
    } else if (atSymbols > 1) {
      return "Email must contain only one @ symbol"
    } else if (!hasDotCom) {
      return "Email must end with .com"
    }
    
    return null
  }

  // Check if email exists in database and validate format
  const checkEmail = React.useCallback(async (email: string) => {
    // First validate email format
    const formatError = validateEmail(email)
    if (formatError) {
      setEmailError(formatError)
      return
    }

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

  // Check if phone number exists in database and validate format
  const checkPhoneNumber = React.useCallback(async (phoneNumber: string) => {
    if (phoneNumber.length > 0 && !phoneNumber.startsWith('09')) {
      setPhoneError("Phone number must start with 09")
      return
    }
    
    if (phoneNumber.length > 0 && phoneNumber.length !== 11) {
      setPhoneError("Phone number must be exactly 11 digits")
      return
    }

    if (!phoneNumber.match(/^09\d{9}$/)) {
      return
    }

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

  // Function to check if the form is valid for submission
  const isFormValid = () => {
    const values = form.getValues()
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "username",
      "phoneNumber",
      "gender",
      "dateOfBirth",
      "password",
      "confirmPassword",
    ] as const

    // Fix: Type-safe field access
    const hasEmptyFields = requiredFields.some((field) => !values[field as keyof typeof values])

    // Check if terms are accepted
    const termsAccepted = values.terms

    // Check for validation errors
    const hasErrors = Object.keys(form.formState.errors).length > 0 || !!usernameError || !!phoneError || !!emailError

    // Button should be enabled only if all conditions pass
    return !hasEmptyFields && termsAccepted && !hasErrors && !isLoading
  }

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

  // Handle phone number input to only allow digits and limit to 11 characters
  const handlePhoneNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numeric digits
    const numericValue = value.replace(/\D/g, "")
    // Limit to 11 digits
    const limitedValue = numericValue.slice(0, 11)

    // Update the form
    form.setValue("phoneNumber", limitedValue)
    
    // Immediate feedback if doesn't start with 09
    if (limitedValue.length > 0 && !limitedValue.startsWith('09')) {
      setPhoneError("Phone number must start with 09")
    } else if (limitedValue.length > 0 && limitedValue.length !== 11) {
      setPhoneError("Phone number must be exactly 11 digits")
    } else {
      setPhoneError(null)
    }

    // Clear any existing timer
    if (phoneTimer.current) clearTimeout(phoneTimer.current)

    // Set a new timer to check phone number after typing stops
    if (limitedValue.length > 0) {
      phoneTimer.current = setTimeout(() => {
        checkPhoneNumber(limitedValue)
      }, 500)
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

      {/* Terms and Conditions Popup */}
      {showTermsPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowTermsPopup(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#ebf8ff] rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* X button and title */}
            <div className="p-5 border-b border-[#1A365D]/20 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#1A365D]">TERMS AND CONDITIONS</h2>
              <button
                onClick={() => setShowTermsPopup(false)}
                className="text-[#1A365D] hover:text-[#2A69AC] transition-colors"
                aria-label="Close terms and conditions"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable terms content - Fixed height to ensure scrollability */}
            <div
              ref={termsContainerRef}
              className="overflow-y-auto px-5 py-4 text-[#1A365D] text-sm"
              style={{
                height: "300px", // Fixed height to ensure scrolling is required
                scrollbarWidth: "thin",
                scrollbarColor: "#2A69AC #ebf8ff",
              }}
              onScroll={handleTermsScroll}
            >
              <div className="pb-4">
                {termsContent.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
                {/* Add a note at the bottom to indicate end of terms */}
                <p className="text-center text-[#2A69AC] font-medium pt-2">--- End of Terms and Conditions ---</p>
              </div>
            </div>

            {/* Bottom button area */}
            <div className="p-5 border-t border-[#1A365D]/20 flex justify-center">
              <Button
                onClick={acceptTerms}
                disabled={!hasScrolledToBottom}
                className={cn(
                  "bg-[#2A69AC] hover:bg-[#1A365D] text-white w-full py-3 text-lg font-medium transition-all duration-300",
                  !hasScrolledToBottom ? "opacity-50 cursor-not-allowed" : "",
                )}
              >
                I HAVE READ THE TERMS AND CONDITIONS
              </Button>
            </div>
          </div>
        </div>
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
                    }, 3000) // 3 seconds delay as requested
                  }}
                  onChange={(e) => {
                    field.onChange(e)

                    // Clear any existing timer
                    if (emailTimer.current) clearTimeout(emailTimer.current)

                    // Set a new timer to check email after typing stops
                    emailTimer.current = setTimeout(() => {
                      checkEmail(e.target.value)
                    }, 3000) // 3 seconds delay as requested
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

                    // Check username immediately on blur
                    checkUsername(e.target.value)
                  }}
                  onChange={(e) => {
                    field.onChange(e)
                    
                    // Clear any existing timer
                    if (usernameTimer.current) clearTimeout(usernameTimer.current)

                    // Set a new timer to check username after typing stops
                    usernameTimer.current = setTimeout(() => {
                      checkUsername(e.target.value)
                    }, 3000) // 3 seconds delay as requested
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
                  type="tel"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) => {
                    handlePhoneNumberInput(e)
                  }}
                  onBlur={field.onBlur}
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
                <Input
                  type="date"
                  placeholder="Date of Birth"
                  className="bg-white/50"
                  {...field}
                  max={new Date().toISOString().split("T")[0]} // Prevent future dates
                />
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
                  <SelectItem value="OTHERS">Others</SelectItem>
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
              <p className="text-xs text-gray-500 mt-1">
                Password must contain at least 8 characters including uppercase, lowercase, number, and special
                character.
              </p>
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
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                  id="terms-checkbox"
                  onClick={handleCheckboxClick}  
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm text-gray-600">
                  I have read and agreed to{" "}
                  <button
                    type="button"
                    className="text-[#2A69AC] hover:underline font-medium"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowTermsPopup(true)
                      setHasScrolledToBottom(false)
                    }}
                  >
                    Terms and Conditions
                  </button>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Button type="submit" className="w-full bg-[#2A69AC] hover:bg-[#1A365D] text-white" disabled={!isFormValid()}>
            {isLoading ? "Registering..." : "Register"}
          </Button>
          <div className="text-center text-sm">
            <span className="text-gray-600">or </span>
            <Link href="/admin/login" className="text-[#2A69AC] hover:underline">
              Login
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}