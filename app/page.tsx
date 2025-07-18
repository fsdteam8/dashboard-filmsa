"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  console.log(session);
  useEffect(() => {
    if (status === "loading") return

    if (session) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#111" }}>
      <div className="text-white">Loading...</div>
    </div>
  )
}
