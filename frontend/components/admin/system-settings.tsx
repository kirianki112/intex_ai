"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Settings, Save, AlertTriangle, Info } from "lucide-react"

export function SystemSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    // Organization settings
    allowSelfRegistration: false,
    requireEmailVerification: true,
    defaultUserRole: "user",
    sessionTimeout: 24,

    // Security settings
    enforceStrongPasswords: true,
    enableTwoFactor: false,
    maxLoginAttempts: 5,
    lockoutDuration: 30,

    // System settings
    maintenanceMode: false,
    debugMode: false,
    logLevel: "info",
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // This would call an API endpoint to save system settings
      // await apiService.updateSystemSettings(settings);
      toast({
        title: "Success",
        description: "System settings updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update system settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>Configure system-wide settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These settings affect the entire organization. Changes will be applied immediately.
            </AlertDescription>
          </Alert>

          {/* User Management Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Management</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Self Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow users to create accounts without invitation</p>
                </div>
                <Switch
                  checked={settings.allowSelfRegistration}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowSelfRegistration: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">Users must verify email before accessing system</p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, requireEmailVerification: checked }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultRole">Default User Role</Label>
                <Input
                  id="defaultRole"
                  value={settings.defaultUserRole}
                  onChange={(e) => setSettings((prev) => ({ ...prev, defaultUserRole: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, sessionTimeout: Number.parseInt(e.target.value) || 24 }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Security Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Security</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enforce Strong Passwords</Label>
                  <p className="text-sm text-muted-foreground">Require complex passwords with special characters</p>
                </div>
                <Switch
                  checked={settings.enforceStrongPasswords}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enforceStrongPasswords: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all user accounts</p>
                </div>
                <Switch
                  checked={settings.enableTwoFactor}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableTwoFactor: checked }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="3"
                  max="10"
                  value={settings.maxLoginAttempts}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, maxLoginAttempts: Number.parseInt(e.target.value) || 5 }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.lockoutDuration}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, lockoutDuration: Number.parseInt(e.target.value) || 30 }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* System Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">System</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">Disable access for non-admin users</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable detailed error logging</p>
                </div>
                <Switch
                  checked={settings.debugMode}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, debugMode: checked }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
