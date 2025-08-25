"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiService, type OrganizationInviteToken } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Plus, Copy, Clock, CheckCircle, XCircle } from "lucide-react"

export function InviteTokens() {
  const [tokens, setTokens] = useState<OrganizationInviteToken[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [ttl, setTtl] = useState(72)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user?.is_staff) {
      loadTokens()
    }
  }, [user])

  const loadTokens = async () => {
    try {
      const tokensData = await apiService.getOrganizationTokens()
      setTokens(tokensData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load invite tokens",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createToken = async () => {
    setError("")
    setCreating(true)

    try {
      await apiService.createOrganizationToken(ttl)
      toast({
        title: "Success",
        description: "Invite token created successfully",
      })
      setCreateDialogOpen(false)
      setTtl(72)
      loadTokens()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token")
    } finally {
      setCreating(false)
    }
  }

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      toast({
        title: "Copied",
        description: "Token copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy token",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const getTokenStatus = (token: OrganizationInviteToken) => {
    if (token.is_used) {
      return { label: "Used", variant: "secondary" as const, icon: CheckCircle }
    }
    if (isExpired(token.expires_at)) {
      return { label: "Expired", variant: "destructive" as const, icon: XCircle }
    }
    return { label: "Active", variant: "default" as const, icon: Clock }
  }

  if (!user?.is_staff) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Organization Invite Tokens</CardTitle>
            <CardDescription>Manage invite tokens for creating new organizations</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invite Token</DialogTitle>
                <DialogDescription>Generate a new token for organization onboarding</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="ttl">Time to Live (hours)</Label>
                  <Input
                    id="ttl"
                    type="number"
                    min="1"
                    max="168"
                    value={ttl}
                    onChange={(e) => setTtl(Number.parseInt(e.target.value) || 72)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Token will expire after {ttl} hours (max 168 hours / 7 days)
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createToken} disabled={creating}>
                  {creating ? "Creating..." : "Create Token"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No invite tokens created yet</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => {
                  const status = getTokenStatus(token)
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={token.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {token.token.substring(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToken(token.token)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{token.created_by}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(token.created_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(token.expires_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToken(token.token)}
                          disabled={token.is_used || isExpired(token.expires_at)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
