// middleware.ts
export { default } from "next-auth/middleware"

// Protect every URL that starts with /dashboard
export const config = {
  matcher: ["/dashboard/:path*"],
}
