"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { type KnowledgeDocument, type ChatSession, apiService } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import {
  FileText,
  MessageSquare,
  Users,
  Building2,
  Upload,
  Zap,
  Bot,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [documentsData, sessionsData] = await Promise.all([apiService.getDocuments(), apiService.getChatSessions()])
      setDocuments(documentsData)
      setChatSessions(sessionsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getDocumentStats = () => {
    return {
      total: documents.length,
      ready: documents.filter((d) => d.status === "ready").length,
      processing: documents.filter((d) => d.status === "processing").length,
      failed: documents.filter((d) => d.status === "failed").length,
    }
  }

  const documentStats = getDocumentStats()
  const recentDocuments = documents.slice(0, 3)
  const recentChats = chatSessions.slice(0, 3)

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Welcome Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-sans">
              Welcome back, {user?.profile.full_name?.split(" ")[0] || "User"}!
            </h1>
            <p className="text-muted-foreground">Manage your organization and explore your knowledge base</p>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {documentStats.ready} ready, {documentStats.processing} processing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatSessions.length}</div>
                <p className="text-xs text-muted-foreground">AI conversations with your documents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready Documents</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats.ready}</div>
                <p className="text-xs text-muted-foreground">Available for search and chat</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats.processing}</div>
                <p className="text-xs text-muted-foreground">Documents being indexed</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/documents">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="mr-2 h-5 w-5 text-primary" />
                    Upload Documents
                  </CardTitle>
                  <CardDescription>Add new documents to your knowledge base</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full bg-transparent">
                    Go to Documents
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/search">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="mr-2 h-5 w-5 text-primary" />
                    Semantic Search
                  </CardTitle>
                  <CardDescription>Search across your documents with AI</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full bg-transparent">
                    Start Searching
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/chat">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="mr-2 h-5 w-5 text-primary" />
                    AI Chat
                  </CardTitle>
                  <CardDescription>Have conversations with your documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full bg-transparent">
                    Start Chatting
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Recent Documents
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/documents">View All</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {recentDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.mime_type.split("/")[1]?.toUpperCase()} • {Math.round(doc.size_bytes / 1024)} KB
                          </p>
                        </div>
                        <div className="flex items-center">
                          {doc.status === "ready" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {doc.status === "processing" && <Clock className="h-4 w-4 text-yellow-500" />}
                          {doc.status === "failed" && <AlertCircle className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No documents yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Chats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Recent Chats
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/chat">View All</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentChats.length > 0 ? (
                  <div className="space-y-3">
                    {recentChats.map((chat) => (
                      <div key={chat.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{chat.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {chat.messages.length} message{chat.messages.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/dashboard/chat">Open</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No chats yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Management Links */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/users">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Users className="mr-2 h-4 w-4" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Manage users and permissions</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/organization">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Building2 className="mr-2 h-4 w-4" />
                    Organization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Organization settings and tokens</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/dashboard/profile">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Users className="mr-2 h-4 w-4" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Update your personal information</p>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
