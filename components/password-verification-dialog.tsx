"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/firebase"
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { toast } from "@/components/ui/use-toast"

interface PasswordVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onVerified: () => void
  cancelButtonText?: string
  confirmButtonText?: string
}

export function PasswordVerificationDialog({
  open,
  onOpenChange,
  title = "Verify Authorization",
  description = "Verifying your password confirms this action.",
  onVerified,
  cancelButtonText = "Cancel",
  confirmButtonText = "Verify",
}: PasswordVerificationDialogProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerification = async () => {
    try {
      setIsVerifying(true)

      // Get the current user
      const currentUser = auth.currentUser

      if (!currentUser || !currentUser.email) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to perform this action.",
          variant: "destructive",
        })
        return
      }

      // Create credential with current user's email and entered password
      const credential = EmailAuthProvider.credential(currentUser.email, password)

      // Attempt to reauthenticate
      await reauthenticateWithCredential(currentUser, credential)

      // If reauthentication succeeds, call the onVerified callback
      onVerified()

      // Reset the dialog state
      setPassword("")
      setPasswordError(false)
      onOpenChange(false)
    } catch (error) {
      console.error("Authentication error:", error)
      setPasswordError(true)
      toast({
        title: "Authentication Failed",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCancel = () => {
    setPassword("")
    setPasswordError(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-[#8B909A] text-center text-sm">{description}</p>

          {passwordError && (
            <div className="mb-4 text-center text-[#EA5455] bg-[#FFE5E5] py-2 px-3 rounded-md">
              Incorrect password. Please try again.
            </div>
          )}

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError(false)
              }}
              className={cn(
                "w-full bg-[#F1F5F9] border-0 pr-10",
                passwordError && "border-[#EA5455] focus-visible:ring-[#EA5455]",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password) {
                  handleVerification()
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <DialogFooter className="flex justify-center gap-4 pt-2">
          <Button
            onClick={handleCancel}
            className="bg-[#FFE5E5] text-[#EA5455] hover:bg-[#FFCDD2] hover:text-[#EA5455] border-0 px-6 transition-colors"
          >
            {cancelButtonText}
          </Button>
          <Button
            onClick={handleVerification}
            disabled={!password || isVerifying}
            className="bg-[#E6FFF3] text-[#28C76F] hover:bg-[#C8F7D6] hover:text-[#28C76F] border-0 px-6 transition-colors"
          >
            {isVerifying ? "Verifying..." : confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

