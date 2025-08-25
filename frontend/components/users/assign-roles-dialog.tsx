"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiService, type Role } from "@/lib/api"
import type { User } from "@/lib/auth"

interface AssignRolesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onRolesAssigned: () => void
}

export function AssignRolesDialog({ open, onOpenChange, user, onRolesAssigned }: AssignRolesDialogProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && user) {
      loadRoles()
      setSelectedRoles(user.roles)
    }
  }, [open, user])

  const loadRoles = async () => {
    try {
      const rolesData = await apiService.getRoles()
      setRoles(rolesData)
    } catch (err) {
      setError("Failed to load roles")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError("")
    setLoading(true)

    try {
      await apiService.assignRoles(user.id, selectedRoles)
      onRolesAssigned()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign roles")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (roleName: string, checked: boolean) => {
    setSelectedRoles((prev) => (checked ? [...prev, roleName] : prev.filter((r) => r !== roleName)))
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogDescription>
            Manage roles for {user.profile.full_name}. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label>Available Roles</Label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.id}
                      checked={selectedRoles.includes(role.name)}
                      onCheckedChange={(checked) => handleRoleChange(role.name, checked as boolean)}
                    />
                    <Label htmlFor={role.id} className="text-sm font-normal">
                      {role.name}
                      {role.description && <span className="text-muted-foreground ml-2">- {role.description}</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Assigning..." : "Assign Roles"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
