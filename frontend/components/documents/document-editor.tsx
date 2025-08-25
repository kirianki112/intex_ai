"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Save, Sparkles, Download, MoreHorizontal, Undo, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { apiService, type Document, type DocumentSection, type EditSectionData } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DocumentEditorProps {
  documentId: string
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [document, setDocument] = useState<Document | null>(null)
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    loadDocument()
    loadSections()
  }, [documentId])

  const loadDocument = async () => {
    try {
      const data = await apiService.getProjectDocument(documentId)
      setDocument(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive",
      })
    }
  }

  const loadSections = async () => {
    try {
      setLoading(true)
      const data = await apiService.getDocumentSections(documentId)
      setSections(data)

      // Initialize section content
      const content: Record<string, string> = {}
      data.forEach((section) => {
        content[section.id] = section.content
      })
      setSectionContent(content)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sections",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSection = async (sectionId: string) => {
    try {
      setSaving(true)
      const content = sectionContent[sectionId]

      const sectionData: EditSectionData = {
        content,
        ai_generated: false,
      }

      await apiService.editSection(sectionId, sectionData)

      toast({
        title: "Success",
        description: "Section saved successfully",
      })

      setEditingSection(null)
      loadSections() // Reload to get updated content
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save section",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateSection = async (sectionId: string) => {
    try {
      setGenerating(sectionId)

      await apiService.generateSection(sectionId, document?.meta?.prompt)

      toast({
        title: "Success",
        description: "AI generation started. Content will update shortly.",
      })

      // Poll for updates
      setTimeout(() => {
        loadSections()
        setGenerating(null)
      }, 3000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate section",
        variant: "destructive",
      })
      setGenerating(null)
    }
  }

  const handleGenerateAll = async () => {
    if (!document) return

    try {
      setGenerating("all")

      await apiService.generateAllSections(documentId, document.meta?.prompt)

      toast({
        title: "Success",
        description: "AI generation started for all sections. Content will update shortly.",
      })

      // Poll for updates
      setTimeout(() => {
        loadSections()
        setGenerating(null)
      }, 5000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate all sections",
        variant: "destructive",
      })
      setGenerating(null)
    }
  }

  const handleUndoSection = async (sectionId: string) => {
    try {
      await apiService.undoSectionEdit(sectionId)

      toast({
        title: "Success",
        description: "Section reverted to previous version",
      })

      loadSections()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to undo section changes",
        variant: "destructive",
      })
    }
  }

  const handleExport = async (format: "docx" | "pdf" | "excel") => {
    if (!document) return

    try {
      await apiService.exportDocument(documentId, format)

      toast({
        title: "Success",
        description: `Export to ${format.toUpperCase()} started. You'll receive a notification when ready.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start export",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (newStatus: Document["status"]) => {
    if (!document) return

    try {
      await apiService.updateProjectDocument(documentId, { status: newStatus })
      setDocument({ ...document, status: newStatus })

      toast({
        title: "Success",
        description: "Document status updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "in_review":
        return "default"
      case "approved":
        return "default"
      case "final":
        return "default"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "draft":
        return <Clock className="h-4 w-4" />
      case "in_review":
        return <AlertCircle className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "final":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading || !document) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading document...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="h-6 w-6" />
              <div>
                <CardTitle className="text-2xl">{document.title}</CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={getStatusColor(document.status)} className="flex items-center space-x-1">
                    {getStatusIcon(document.status)}
                    <span>{document.status.replace("_", " ")}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Updated {new Date(document.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Select value={document.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleGenerateAll} disabled={generating === "all"} variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                {generating === "all" ? "Generating..." : "Generate All"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("docx")}>Export as DOCX</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>Export as PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("excel")}>Export as Excel</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  {section.is_locked && <Badge variant="outline">Locked</Badge>}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateSection(section.id)}
                    disabled={generating === section.id || section.is_locked}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {generating === section.id ? "Generating..." : "Generate"}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleUndoSection(section.id)}>
                        <Undo className="h-4 w-4 mr-2" />
                        Undo Changes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingSection === section.id ? (
                <div className="space-y-4">
                  <Textarea
                    value={sectionContent[section.id] || ""}
                    onChange={(e) =>
                      setSectionContent({
                        ...sectionContent,
                        [section.id]: e.target.value,
                      })
                    }
                    rows={10}
                    className="min-h-[200px]"
                  />
                  <div className="flex items-center space-x-2">
                    <Button onClick={() => handleSaveSection(section.id)} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingSection(null)
                        setSectionContent({
                          ...sectionContent,
                          [section.id]: section.content,
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className="prose max-w-none cursor-pointer p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    onClick={() => !section.is_locked && setEditingSection(section.id)}
                  >
                    {section.content ? (
                      <div className="whitespace-pre-wrap">{section.content}</div>
                    ) : (
                      <div className="text-muted-foreground italic">Click to add content or use AI generation</div>
                    )}
                  </div>
                  {!section.is_locked && (
                    <Button variant="outline" size="sm" onClick={() => setEditingSection(section.id)}>
                      Edit Section
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
