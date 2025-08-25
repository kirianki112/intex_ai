"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiService, type UpdateUserData } from "@/lib/api"
import type { User } from "@/lib/auth"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onUserUpdated: () => void
}

export function EditUserDialog({ open, onOpenChange, user, onUserUpdated }: EditUserDialogProps) {
  const [formData, setFormData] = useState<UpdateUserData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        is_active: user.is_active,
        profile: {
          full_name: user.profile.full_name,
          job_title: user.profile.job_title || "",
          phone_number: user.profile.phone_number || "",
          bio: user.profile.bio || "",
          location: user.profile.location || "",
          linkedin: user.profile.linkedin || "",
          github: user.profile.github || "",
        },
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError("")
    setLoading(true)

    try {
      await apiService.updateUser(user.id, formData)
      onUserUpdated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information and profile details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active || false}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active User</Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.profile?.full_name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, full_name: e.target.value },
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.profile?.job_title || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, job_title: e.target.value },
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.profile?.phone_number || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, phone_number: e.target.value },
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.profile?.location || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, location: e.target.value },
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.profile?.linkedin || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, linkedin: e.target.value },
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={formData.profile?.github || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, github: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
