export interface User {
  id: string
  email: string
  organization: string
  is_active: boolean
  is_staff: boolean
  profile: {
    full_name: string
    job_title: string | null
    phone_number: string | null
    bio: string | null
    avatar: string | null
    location: string | null
    linkedin: string | null
    github: string | null
    created_at: string
    updated_at: string
  }
  roles: string[]
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface OnboardingData {
  token: string
  name: string
  admin_email: string
  admin_password: string
  admin_full_name: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

class AuthService {
  private getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/api/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error("Invalid credentials")
    }

    const tokens = await response.json()
    localStorage.setItem("access_token", tokens.access)
    localStorage.setItem("refresh_token", tokens.refresh)
    return tokens
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      this.logout()
      throw new Error("Token refresh failed")
    }

    const { access } = await response.json()
    localStorage.setItem("access_token", access)
    return access
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/users/me/`, {
      headers: {
        ...this.getAuthHeaders(),
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        try {
          await this.refreshToken()
          return this.getCurrentUser()
        } catch {
          this.logout()
          throw new Error("Authentication failed")
        }
      }
      throw new Error("Failed to fetch user data")
    }

    return response.json()
  }

  async onboardOrganization(data: OnboardingData) {
    const response = await fetch(`${API_BASE_URL}/api/accounts/onboard/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Onboarding failed")
    }

    return response.json()
  }

  logout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    window.location.href = "/login"
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token")
  }
}

export const authService = new AuthService()
