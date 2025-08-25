"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { Building2, Users, Calendar, Shield } from "lucide-react"

interface OrganizationOverviewProps {
  users: any[]
}

export function OrganizationOverview({ users }: OrganizationOverviewProps) {
  const { user } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const adminUsers = users.filter((u) => u.roles.includes("admin"))
  const activeUsers = users.filter((u) => u.is_active)

  return (
    <div className="space-y-6">
      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-lg">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-sans">Organization Overview</CardTitle>
              <CardDescription>Manage your organization settings and information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Organization ID</p>
              <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{user?.organization}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{activeUsers.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Administrators</p>
              <p className="text-2xl font-bold text-blue-600">{adminUsers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers.length} active, {users.length - activeUsers.length} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {((adminUsers.length / users.length) * 100).toFixed(1)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Joins</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                users.filter((u) => new Date(u.profile.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">In the last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(users.flatMap((u) => u.roles)).size}</div>
            <p className="text-xs text-muted-foreground">Unique roles assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Members</CardTitle>
          <CardDescription>Users who joined in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users
              .filter((u) => new Date(u.profile.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
              .slice(0, 5)
              .map((user) => (
                <div key={user.id} className="flex items-center space-x-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profile.avatar || ""} alt={user.profile.full_name} />
                    <AvatarFallback className="bg-muted">{getInitials(user.profile.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{user.profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex space-x-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDate(user.profile.created_at)}</div>
                </div>
              ))}
            {users.filter((u) => new Date(u.profile.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
              .length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No new members in the last 30 days</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
