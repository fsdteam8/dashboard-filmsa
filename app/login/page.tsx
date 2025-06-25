// @ts-nocheck
"use client"

import type React from "react"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid credentials. Please try again.")
      } else {
        // Get the session to access the token
        const session = await getSession()
        if (session?.accessToken) {
          // Store the token in localStorage for API calls
          localStorage.setItem("auth_token", session.accessToken)
        }

        toast.success("Login successful!")
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "black" }}>
      <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Hello, Welcome!</h1>
            <p className="text-gray-400">Please Enter Your Details Below to Continue</p>
          </div>
      <Card className="w-full max-w-lg bg-[#111] border-gray-700">
        <CardContent className="p-4">
        

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-gray-600 text-white placeholder:text-gray-400 h-12"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-gray-600 text-white placeholder:text-gray-400 h-12"
                required
                disabled={isLoading}
              />
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-gray-400 hover:text-white text-sm transition-colors">
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-100 rounded-full h-12 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
