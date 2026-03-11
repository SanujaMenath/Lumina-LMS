import type { LoginCredentials, AuthResponse } from "../types/auth"
import { API_BASE_URL } from "./api"



export const loginService = async (
  data: LoginCredentials
): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  if (!res.ok) throw await res.json()
  return res.json()
}
