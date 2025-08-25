"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Save,
  Sparkles,
  Download,
  MoreHorizontal,
  Undo,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Eye,
  TrendingUp,
  Zap,
  BookOpen,
  Settings,
  BarChart3,
  Activity,
  Brain,
} from "lucide-react"
import { apiService, type Document, type DocumentSection, type EditSectionData } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { AIGenerationDialog } from "./ai-generation-dialog"
import { EnhancedExportDialog } from "./enhanced-export-dialog"
import { CitationManager } from "../citations/citation-manager"

interface EnhancedDocumentEditorProps {
  documentId: string
}

export function EnhancedDocumentEditor({ documentId }: EnhancedDocumentEditorProps) {
  const [document, setDocument] = useState<Document | null>(null)
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [sectionContent, setSectionContent] = useState<Record<string, string>>({})
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [aiDialogContext, setAIDialogContext] = useState<{
    documentId?: string
    sectionId?: string
    sectionTitle?: string
  }>({})
  const [activeTab, setActiveTab] = useState("editor")
  const { toast } = useToast()

  // Mock analytics data - in real app, this would come from API
  const [analytics] = useState({
    completionRate: 75,
    wordCount: 2847,
    aiGeneratedContent: 45,
    collaborators: 3,
    lastActivity: "2 minutes ago",
    exportCount: 12,
    viewCount: 28,
  })

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

  // ... existing handler functions ...

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
      loadSections()
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

  const openAIDialog = (context: { documentId?: string; sectionId?: string; sectionTitle?: string }) => {
    setAIDialogContext(context)
    setShowAIDialog(true)
  }

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "in_review":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "final":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
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
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Header */}
        <div className="border-b bg-card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">{document.title}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge className={getStatusColor(document.status)}>
                      {getStatusIcon(document.status)}
                      <span className="ml-1">{document.status.replace("_", " ")}</span>
                    </Badge>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{analytics.collaborators} collaborators</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span>Last activity {analytics.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => openAIDialog({ documentId })}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI Assistant
                </Button>
                <Button onClick={() => setShowExportDialog(true)} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Select
                  value={document.status}
                  onValueChange={(value) => {
                    /* handle status change */
                  }}
                >
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
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold">{analytics.completionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <Progress value={analytics.completionRate} className="mt-2" />
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Word Count</p>
                    <p className="text-2xl font-bold">{analytics.wordCount.toLocaleString()}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">AI Generated</p>
                    <p className="text-2xl font-bold">{analytics.aiGeneratedContent}%</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="text-2xl font-bold">{analytics.viewCount}</p>
                  </div>
                  <Eye className="h-8 w-8 text-gray-600" />
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="editor">Document Editor</TabsTrigger>
              <TabsTrigger value="citations">Citations</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-6 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  {sections.map((section) => (
                    <Card key={section.id} className="relative">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{section.title}</CardTitle>
                          <div className="flex items-center space-x-2">
                            {section.is_locked && <Badge variant="outline">Locked</Badge>}
                            <Button
                              size="sm"
                              onClick={() => openAIDialog({ sectionId: section.id, sectionTitle: section.title })}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                            >
                              <Sparkles className="h-4 w-4 mr-1" />
                              AI Generate
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => {
                                    /* handle undo */
                                  }}
                                >
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
                              rows={12}
                              className="min-h-[300px] font-mono"
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
                              className="prose max-w-none cursor-pointer p-6 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary hover:bg-muted/50 transition-all duration-200"
                              onClick={() => !section.is_locked && setEditingSection(section.id)}
                            >
                              {section.content ? (
                                <div className="whitespace-pre-wrap leading-relaxed">{section.content}</div>
                              ) : (
                                <div className="text-center py-8">
                                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <p className="text-muted-foreground text-lg mb-2">Ready for content</p>
                                  <p className="text-sm text-muted-foreground">Click to write or use AI generation</p>
                                </div>
                              )}
                            </div>
                            {!section.is_locked && (
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => setEditingSection(section.id)}>
                                  Edit Section
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAIDialog({ sectionId: section.id, sectionTitle: section.title })}
                                >
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  AI Generate
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="citations" className="mt-6">
              <CitationManager documentId={documentId} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Document Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Exports</span>
                      <span className="font-bold">{analytics.exportCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Views</span>
                      <span className="font-bold">{analytics.viewCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collaborators</span>
                      <span className="font-bold">{analytics.collaborators}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Content Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Word Count</span>
                      <span className="font-bold">{analytics.wordCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Generated</span>
                      <span className="font-bold">{analytics.aiGeneratedContent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion</span>
                      <span className="font-bold">{analytics.completionRate}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Document Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Document settings and preferences will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-80 border-l bg-card/50 p-6">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold">AI Writing Assistant</h3>
            <p className="text-sm text-muted-foreground">Enhance your document with AI-powered content generation</p>
          </div>

          <Separator />

          <div className="space-y-4">
            <Button
              onClick={() => openAIDialog({ documentId })}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate All Sections
            </Button>

            <Button onClick={() => setShowExportDialog(true)} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Document
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Quick Actions</h4>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                View Citations
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Document Analytics
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Share & Collaborate
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AIGenerationDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        documentId={aiDialogContext.documentId}
        sectionId={aiDialogContext.sectionId}
        sectionTitle={aiDialogContext.sectionTitle}
        onSuccess={() => {
          loadSections()
          setShowAIDialog(false)
        }}
      />

      <EnhancedExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        documentId={documentId}
        documentTitle={document.title}
      />
    </div>
  )
}
