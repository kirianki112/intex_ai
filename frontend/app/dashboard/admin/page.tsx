"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminOverview } from "@/components/admin/admin-overview"
import { BulkOperations } from "@/components/admin/bulk-operations"
import { SystemSettings } from "@/components/admin/system-settings"
import { InviteTokens } from "@/components/organization/invite-tokens"
import { useAuth } from "@/hooks/use-auth"
import { apiService } from "@/lib/api"
import type { User } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Shield, AlertTriangle } from "lucide-react"

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  const isAdmin = user?.roles.includes("admin")
  const isSuperUser = user?.is_staff

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      const usersData = await apiService.getUsers()
      setUsers(usersData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Alert className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access admin features. Contact your administrator for access.
              </AlertDescription>
            </Alert>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-sans">Admin Panel</h1>
              <p className="text-muted-foreground">System administration and management tools</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="bulk-ops">Bulk Operations</TabsTrigger>
                <TabsTrigger value="settings">System Settings</TabsTrigger>
                {isSuperUser && <TabsTrigger value="tokens">Invite Tokens</TabsTrigger>}
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <AdminOverview users={users} />
              </TabsContent>

              <TabsContent value="bulk-ops" className="space-y-6">
                <BulkOperations users={users} onUsersUpdated={loadUsers} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <SystemSettings />
              </TabsContent>

              {isSuperUser && (
                <TabsContent value="tokens" className="space-y-6">
                  <InviteTokens />
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
