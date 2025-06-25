import { api } from "./api"

export interface PasswordResetResponse {
  success: boolean
  message: string
}

export const passwordResetService = {
  sendResetEmail: async (email: string): Promise<PasswordResetResponse> => {
    const response = await api.post("/api/password/email", { email })
    return response.data
  },

  verifyOTP: async (email: string, otp: string): Promise<PasswordResetResponse> => {
    const response = await api.post("/api/password/verify-otp", { email, otp })
    return response.data
  },

  resetPassword: async (
    email: string,
    password: string,
    password_confirmation: string,
  ): Promise<PasswordResetResponse> => {
    const response = await api.post("/api/password/reset", {
      email,
      password,
      password_confirmation,
    })
    return response.data
  },
}
