"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase"; // Import Firestore
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"; // Firestore functions
import { useRouter } from "next/navigation";

const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"), 
    username: z.string().min(3, "Username must be at least 3 characters"),
    phoneNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in format: 09XXXXXXXXX"),
    gender: z.enum(["MALE", "FEMALE"]),
    password: z.string().min(8, "Password must be at least 8 characters"),
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

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phoneNumber: "",
      gender: undefined,
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  // Function to generate a new UID
  const generateUID = async () => {
    const counterDocRef = doc(db, "counters", "userCounter");
    const counterDocSnap = await getDoc(counterDocRef);

    let newNumber = 1;
    if (counterDocSnap.exists()) {
      newNumber = counterDocSnap.data().lastNumber + 1;
    }
    //Tweak this to change format of UID
    const newUID = `#CU${newNumber.toString().padStart(5, '0')}`;

    await setDoc(counterDocRef, { lastNumber: newNumber });

    return newUID;
  }

  // Backend: Handles user registration
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setSuccess(false);

    try {
      // 1️⃣ Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2️⃣ Update user profile
      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`
      });

      // 3️⃣ Generate custom UID
      const customUid = await generateUID();

      // 4️⃣ Save user details to Firestore with BOTH UIDs
      const userDoc = {
        customUid: customUid, // Store custom UID
        authUid: user.uid,    // Store Firebase Auth UID
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        phoneNumber: values.phoneNumber,
        gender: values.gender,
        email: values.email,
        termsAccepted: values.terms,
        createdAt: new Date().toISOString()
      };


      await Promise.all([
        setDoc(doc(db, "users", user.uid), userDoc),     // Primary document using Auth UID
         {  // Reference document using custom UID
          authUid: user.uid
        },
      ]);

      setSuccess(true);
      
      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 500);

    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.message);
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
          <AlertDescription>Registered successfully</AlertDescription>
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
                <Input placeholder="Email" className="bg-white/50" {...field} />
              </FormControl>
              <FormMessage />
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
                  className={cn(
                    "bg-white/50",
                    error?.includes("Username") && "border-red-500 focus-visible:ring-red-500",
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
                  className={cn("bg-white/50", error?.includes("phone") && "border-red-500 focus-visible:ring-red-500")}
                  {...field}
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
                {" "}
                {/* Ensure empty value initially */}
                <FormControl>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Gender" /> {/* Placeholder stays until selection */}
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
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Button type="submit" className="w-full bg-primary text-white">
            Register
          </Button>
          <div className="text-center text-sm">
            <span className="text-gray-600">or </span>
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}

