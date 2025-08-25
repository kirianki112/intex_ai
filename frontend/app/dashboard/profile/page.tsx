"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProfileForm } from "@/components/profile/profile-form"
import { AccountInfo } from "@/components/profile/account-info"
import { ProfilePreview } from "@/components/profile/profile-preview"

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-sans">Profile</h1>
            <p className="text-muted-foreground">Manage your personal information and account settings</p>
          </div>

          <Tabs defaultValue="edit" className="space-y-6">
            <TabsList>
              <TabsTrigger value="edit">Edit Profile</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-6">
              <ProfileForm />
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <ProfilePreview />
                <AccountInfo />
              </div>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <AccountInfo />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
