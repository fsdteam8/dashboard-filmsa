"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { passwordResetService } from "@/lib/password-reset-service"
import { toast } from "sonner"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(43)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleChange = (index: number, value: string) => {
    // Handle paste operation
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split("")
      const newOtp = [...otp]

      pastedData.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) {
          newOtp[index + i] = char
        }
      })

      setOtp(newOtp)

      // Focus on the next empty field or the last field
      const nextIndex = Math.min(index + pastedData.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    // Handle single character input
    if (/^\d$/.test(value) || value === "") {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Move to next field if value is entered
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP")
      return
    }

    setIsLoading(true)
    try {
      const response = await passwordResetService.verifyOTP(email, otpString)
      if (response.success) {
        toast.success("OTP verified successfully!")
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
      } else {
        toast.error(response.message || "Invalid OTP")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return

    setIsLoading(true)
    try {
      const response = await passwordResetService.sendResetEmail(email)
      if (response.success) {
        toast.success("OTP sent successfully!")
        setResendTimer(43)
        setCanResend(false)
        setOtp(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      } else {
        toast.error(response.message || "Failed to resend OTP")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#111" }}>
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Verify OTP</h1>
            <p className="text-gray-400">
              Please check your Email for a message with your code. Your code is 6 numbers long.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-white text-lg font-semibold bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
              ))}
            </div>

            <div className="text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-white hover:text-gray-300 text-sm transition-colors"
                >
                  Resend code
                </button>
              ) : (
                <p className="text-gray-400 text-sm">Resend code in {resendTimer}s</p>
              )}
            </div>

            <Button
              onClick={handleVerify}
              disabled={isLoading || otp.join("").length !== 6}
              className="w-full bg-white text-black hover:bg-gray-100 h-12 text-base font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-gray-400 hover:text-white text-sm transition-colors inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Email
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
