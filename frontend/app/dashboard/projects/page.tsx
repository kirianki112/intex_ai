"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiService, type Document } from "@/lib/api"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  title: string
  status: "draft" | "in_review" | "approved" | "final"
  template?: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
  sections_count: number
  citations_count: number
  finalized_at?: string
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Clock },
  in_review: { label: "In Review", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  final: { label: "Final", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const documents = await apiService.getProjectDocuments()
      setProjects(documents)
    } catch (err) {
      console.error("Failed to fetch projects:", err)
      setError("Failed to load projects. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = () => {
    router.push("/dashboard/projects/new")
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "all" || project.status === activeTab
    return matchesSearch && matchesTab
  })

  const getStatusCounts = () => {
    return {
      all: projects.length,
      draft: projects.filter((p) => p.status === "draft").length,
      in_review: projects.filter((p) => p.status === "in_review").length,
      approved: projects.filter((p) => p.status === "approved").length,
      final: projects.filter((p) => p.status === "final").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">Manage your document projects and concept notes</p>
            </div>
            <Button onClick={handleCreateProject} className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProjects}
                className="ml-2 text-red-700 border-red-300 hover:bg-red-100 bg-transparent"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{statusCounts.draft + statusCounts.in_review}</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{statusCounts.approved}</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Finalized</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{statusCounts.final}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
              />
            </div>
          </div>

          {/* Projects Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="draft" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Draft ({statusCounts.draft})
              </TabsTrigger>
              <TabsTrigger value="in_review" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                In Review ({statusCounts.in_review})
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Approved ({statusCounts.approved})
              </TabsTrigger>
              <TabsTrigger value="final" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Final ({statusCounts.final})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading projects...</div>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first project"}
                  </p>
                  <Button onClick={handleCreateProject} className="bg-gray-900 hover:bg-gray-800 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => {
                    const StatusIcon = statusConfig[project.status].icon
                    return (
                      <Card
                        key={project.id}
                        className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleProjectClick(project.id)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                              {project.title}
                            </CardTitle>
                            <Badge className={`${statusConfig[project.status].color} border-0`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[project.status].label}
                            </Badge>
                          </div>
                          {project.template && (
                            <CardDescription className="text-gray-600">Template-based project</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>{project.status === "final" ? "Finalized" : "In Progress"}</span>
                              {project.finalized_at && <span>Completed</span>}
                            </div>
                            <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
