"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { OrganizationOverview } from "@/components/organization/organization-overview"
import { OrganizationSettings } from "@/components/organization/organization-settings"
import { InviteTokens } from "@/components/organization/invite-tokens"
import { useAuth } from "@/hooks/use-auth"
import { apiService } from "@/lib/api"
import type { User } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function OrganizationPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  const isSuperUser = user?.is_staff

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const usersData = await apiService.getUsers()
      setUsers(usersData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load organization data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-sans">Organization</h1>
            <p className="text-muted-foreground">Manage your organization settings and overview</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                {isSuperUser && <TabsTrigger value="tokens">Invite Tokens</TabsTrigger>}
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <OrganizationOverview users={users} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <OrganizationSettings />
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
