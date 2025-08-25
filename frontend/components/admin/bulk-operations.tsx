"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { apiService } from "@/lib/api"
import type { User } from "@/lib/auth"
import { UserCheck, UserX, Trash2, Settings } from "lucide-react"

interface BulkOperationsProps {
  users: User[]
  onUsersUpdated: () => void
}

export function BulkOperations({ users, onUsersUpdated }: BulkOperationsProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const { toast } = useToast()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleUserSelect = (userId: string, checked: boolean) => {
    setSelectedUsers((prev) => (checked ? [...prev, userId] : prev.filter((id) => id !== userId)))
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? users.map((u) => u.id) : [])
  }

  const executeBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return

    setLoading(true)
    try {
      const promises = selectedUsers.map((userId) => {
        switch (bulkAction) {
          case "activate":
            return apiService.updateUser(userId, { is_active: true })
          case "deactivate":
            return apiService.updateUser(userId, { is_active: false })
          case "delete":
            return apiService.deleteUser(userId)
          default:
            return Promise.resolve()
        }
      })

      await Promise.all(promises)

      toast({
        title: "Success",
        description: `Bulk operation completed for ${selectedUsers.length} users`,
      })

      setSelectedUsers([])
      setBulkAction("")
      onUsersUpdated()
    } catch (error) {
      toast({
        title: "Error",
        description: "Some operations failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setConfirmDialogOpen(false)
    }
  }

  const getActionDescription = () => {
    const count = selectedUsers.length
    switch (bulkAction) {
      case "activate":
        return `Activate ${count} selected user${count !== 1 ? "s" : ""}`
      case "deactivate":
        return `Deactivate ${count} selected user${count !== 1 ? "s" : ""}`
      case "delete":
        return `Permanently delete ${count} selected user${count !== 1 ? "s" : ""}`
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bulk Operations
          </CardTitle>
          <CardDescription>Select multiple users and perform bulk actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All ({users.length})
              </label>
            </div>

            {selectedUsers.length > 0 && (
              <>
                <Badge variant="secondary">{selectedUsers.length} selected</Badge>

                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Choose action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Activate Users
                      </div>
                    </SelectItem>
                    <SelectItem value="deactivate">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4" />
                        Deactivate Users
                      </div>
                    </SelectItem>
                    <SelectItem value="delete">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Users
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={!bulkAction || loading}
                  variant={bulkAction === "delete" ? "destructive" : "default"}
                >
                  Execute Action
                </Button>
              </>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                  selectedUsers.includes(user.id) ? "bg-muted" : ""
                }`}
              >
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                />

                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profile.avatar || ""} alt={user.profile.full_name} />
                  <AvatarFallback className="bg-muted">{getInitials(user.profile.full_name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.profile.full_name}</p>
                    <Badge variant={user.is_active ? "default" : "destructive"} className="text-xs">
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <div className="flex gap-1">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="outline" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionDescription()}
              {bulkAction === "delete" && (
                <span className="block mt-2 text-destructive font-medium">This action cannot be undone.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              className={
                bulkAction === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
              }
            >
              {loading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
