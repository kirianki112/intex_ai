"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService } from "@/lib/auth"

export function OnboardingForm() {
  const [formData, setFormData] = useState({
    token: "",
    name: "",
    admin_email: "",
    admin_password: "",
    admin_full_name: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await authService.onboardOrganization(formData)
      router.push("/login?message=Organization created successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Organization</CardTitle>
        <CardDescription className="text-center">Set up your organization and admin account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="token">Invite Token</Label>
            <Input
              id="token"
              placeholder="Enter your invite token"
              value={formData.token}
              onChange={(e) => handleChange("token", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              placeholder="Enter organization name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_full_name">Admin Full Name</Label>
            <Input
              id="admin_full_name"
              placeholder="Enter admin full name"
              value={formData.admin_full_name}
              onChange={(e) => handleChange("admin_full_name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_email">Admin Email</Label>
            <Input
              id="admin_email"
              type="email"
              placeholder="Enter admin email"
              value={formData.admin_email}
              onChange={(e) => handleChange("admin_email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_password">Admin Password</Label>
            <Input
              id="admin_password"
              type="password"
              placeholder="Enter admin password"
              value={formData.admin_password}
              onChange={(e) => handleChange("admin_password", e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Organization..." : "Create Organization"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
