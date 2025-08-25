"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Edit3,
  Download,
  Share2,
  Settings,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Eye,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiService, type Document, type DocumentSection, type CitationGroup } from "@/lib/api"
import { DocumentReview } from "@/components/documents/document-review" // Added DocumentReview import

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Clock },
  in_review: { label: "In Review", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  final: { label: "Final", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Document | null>(null)
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [citations, setCitations] = useState<CitationGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [citationsLoading, setCitationsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const document = await apiService.getProjectDocument(projectId)
      setProject(document)

      await Promise.all([fetchSections(), fetchCitations()])
    } catch (err) {
      console.error("Failed to fetch project:", err)
      setError("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      setSectionsLoading(true)
      const sectionsData = await apiService.getDocumentSections(projectId)
      setSections(sectionsData)
    } catch (err) {
      console.error("Failed to fetch sections:", err)
    } finally {
      setSectionsLoading(false)
    }
  }

  const fetchCitations = async () => {
    try {
      setCitationsLoading(true)
      const citationsData = await apiService.getDocumentCitations(projectId)
      setCitations(citationsData)
    } catch (err) {
      console.error("Failed to fetch citations:", err)
    } finally {
      setCitationsLoading(false)
    }
  }

  const handleEditProject = () => {
    router.push(`/dashboard/documents/${projectId}`)
  }

  const handleExportProject = async (format: "docx" | "pdf" | "excel") => {
    try {
      await apiService.exportDocument(projectId, format)
    } catch (err) {
      console.error("Export failed:", err)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading project...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !project) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error || "Project not found"}</div>
            <Button onClick={() => router.push("/dashboard/projects")}>Back to Projects</Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const StatusIcon = statusConfig[project.status].icon
  const completionPercentage =
    project.status === "final" ? 100 : project.status === "approved" ? 80 : project.status === "in_review" ? 60 : 30

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/projects")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className={`${statusConfig[project.status].color} border-0`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[project.status].label}
                  </Badge>
                  <span className="text-gray-500 text-sm">
                    Updated {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button onClick={handleEditProject} className="bg-gray-900 hover:bg-gray-800 text-white">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            </div>
          </div>

          {/* Progress Overview */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Completion</span>
                  <span className="text-sm text-gray-500">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{sections.length}</div>
                    <div className="text-sm text-gray-500">Sections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {citations.reduce((total, group) => total + group.chunks_used.length, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Citations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.ceil((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm text-gray-500">Days Active</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sections" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Sections
              </TabsTrigger>
              <TabsTrigger value="citations" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Citations
              </TabsTrigger>
              <TabsTrigger value="review" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Eye className="h-4 w-4 mr-2" />
                Review
              </TabsTrigger>
              <TabsTrigger value="export" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Template</Label>
                      <p className="text-gray-900">{project.template || "No template"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Created</Label>
                      <p className="text-gray-900">{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Last Modified</Label>
                      <p className="text-gray-900">{new Date(project.updated_at).toLocaleDateString()}</p>
                    </div>
                    {project.finalized_at && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Finalized</Label>
                        <p className="text-gray-900">{new Date(project.finalized_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={handleEditProject}
                      className="w-full justify-start bg-transparent"
                      variant="outline"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Document
                    </Button>
                    <Button
                      onClick={() => handleExportProject("docx")}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as DOCX
                    </Button>
                    <Button
                      onClick={() => handleExportProject("pdf")}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as PDF
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Document Sections</CardTitle>
                  <CardDescription>Manage and edit individual sections of your document</CardDescription>
                </CardHeader>
                <CardContent>
                  {sectionsLoading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Loading sections...</div>
                    </div>
                  ) : sections.length > 0 ? (
                    <div className="space-y-3">
                      {sections.map((section, index) => (
                        <div
                          key={section.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                              {section.order}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{section.title}</h4>
                              <p className="text-sm text-gray-500">
                                {section.content ? `${section.content.length} characters` : "Empty"}
                                {section.is_locked && <span className="ml-2 text-yellow-600">• Locked</span>}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={handleEditProject}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
                      <p className="text-gray-500 mb-4">Start editing your document to create sections</p>
                      <Button onClick={handleEditProject}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Start Editing
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="citations" className="space-y-4">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Citations</CardTitle>
                  <CardDescription>References and sources used in this document</CardDescription>
                </CardHeader>
                <CardContent>
                  {citationsLoading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Loading citations...</div>
                    </div>
                  ) : citations.length > 0 ? (
                    <div className="space-y-4">
                      {citations.map((group, index) => (
                        <div key={group.kb_document_id} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">{group.document_title}</h4>
                          <div className="space-y-2">
                            {group.chunks_used.map((chunk) => (
                              <div key={chunk.citation_id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  Section {chunk.section_id} - Marker: {chunk.marker}
                                </span>
                                {chunk.confidence_score && (
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(chunk.confidence_score * 100)}%
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No citations yet</h3>
                      <p className="text-gray-500">Citations will appear here as you add references to your document</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              <DocumentReview documentId={projectId} />
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                  <CardDescription>Download your document in various formats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleExportProject("docx")}
                      className="h-20 flex-col space-y-2"
                      variant="outline"
                    >
                      <Download className="h-6 w-6" />
                      <span>Export DOCX</span>
                    </Button>
                    <Button
                      onClick={() => handleExportProject("pdf")}
                      className="h-20 flex-col space-y-2"
                      variant="outline"
                    >
                      <Download className="h-6 w-6" />
                      <span>Export PDF</span>
                    </Button>
                    <Button
                      onClick={() => handleExportProject("excel")}
                      className="h-20 flex-col space-y-2"
                      variant="outline"
                    >
                      <Download className="h-6 w-6" />
                      <span>Export Excel</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
