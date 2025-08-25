"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileText, Sparkles, CheckCircle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiService, type DocumentTemplate } from "@/lib/api"

export default function NewProjectPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const templateList = await apiService.getTemplates()
      setTemplates(templateList)
    } catch (err) {
      console.error("Failed to fetch templates:", err)
      setError("Failed to load templates")
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!selectedTemplate || !projectData.title.trim()) {
      setError("Please select a template and enter a project title")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const document = await apiService.createDocument({
        title: projectData.title,
        template_id: selectedTemplate,
      })

      router.push(`/dashboard/projects/${document.id}`)
    } catch (err) {
      console.error("Failed to create project:", err)
      setError("Failed to create project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/projects")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600 mt-1">Start a new document project from a template</p>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Details */}
            <div className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Project Details
                  </CardTitle>
                  <CardDescription>Basic information about your project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter project title..."
                      value={projectData.title}
                      onChange={(e) => setProjectData((prev) => ({ ...prev, title: e.target.value }))}
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your project..."
                      value={projectData.description}
                      onChange={(e) => setProjectData((prev) => ({ ...prev, description: e.target.value }))}
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Template Selection */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Choose Template
                  </CardTitle>
                  <CardDescription>Select a template to structure your document</CardDescription>
                </CardHeader>
                <CardContent>
                  {templatesLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading templates...</div>
                  ) : (
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              {template.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Template Preview */}
            <div className="space-y-6">
              {selectedTemplateData ? (
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle>Template Preview</CardTitle>
                    <CardDescription>{selectedTemplateData.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-600 text-sm">{selectedTemplateData.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Sections ({selectedTemplateData.sections?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {selectedTemplateData.sections?.map((section, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            {section.title}
                          </div>
                        )) || <p className="text-gray-500 text-sm">No sections defined</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gray-200">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
                    <p className="text-gray-500">Choose a template to see its preview and structure</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={() => router.push("/dashboard/projects")}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={loading || !selectedTemplate || !projectData.title.trim()}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {loading ? "Creating Project..." : "Create Project"}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
