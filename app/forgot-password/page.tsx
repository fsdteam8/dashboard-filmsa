"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { passwordResetService } from "@/lib/password-reset-service"
import { toast } from "sonner"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailOption, setShowEmailOption] = useState(false)
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email address")
      return
    }
    setShowEmailOption(true)
  }

  const handleSendOTP = async () => {
    setIsLoading(true)
    try {
      const response = await passwordResetService.sendResetEmail(email)
      if (response.success) {
        toast.success("OTP sent to your email successfully!")
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
      } else {
        toast.error(response.message || "Failed to send OTP")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const maskEmail = (email: string) => {
    const [username, domain] = email.split("@")
    if (username.length <= 3) return email
    const maskedUsername = username.slice(0, 3) + "*".repeat(username.length - 3)
    return `${maskedUsername}@${domain}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#111" }}>
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
            <p className="text-gray-400">
              {showEmailOption
                ? "Select which contact details should we use to reset your password"
                : "Enter your email address to reset your password"}
            </p>
          </div>

          {!showEmailOption ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 h-12"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-100 h-12 text-base font-medium">
                Continue
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-white text-sm transition-colors inline-flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div
                className="border border-gray-600 rounded-lg p-4 cursor-pointer hover:border-gray-500 transition-colors"
                onClick={handleSendOTP}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">via Email:</p>
                    <p className="text-white font-medium">{maskEmail(email)}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full bg-white text-black hover:bg-gray-100 h-12 text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowEmailOption(false)}
                  className="text-gray-400 hover:text-white text-sm transition-colors inline-flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Change Email
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
