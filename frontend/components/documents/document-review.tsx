"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Download, Eye, Calendar, User, Building, Hash, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { apiService, type Document, type DocumentSection } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DocumentReviewProps {
  documentId: string
}

export function DocumentReview({ documentId }: DocumentReviewProps) {
  const [document, setDocument] = useState<Document | null>(null)
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadDocumentData()
  }, [documentId])

  const loadDocumentData = async () => {
    try {
      setLoading(true)
      const [docData, sectionsData] = await Promise.all([
        apiService.getProjectDocument(documentId),
        apiService.getDocumentSections(documentId),
      ])

      setDocument(docData)
      setSections(sectionsData.sort((a, b) => a.order - b.order))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "in_review":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "final":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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

  // Simple markdown-like rendering for headers and formatting
  const renderContent = (content: string) => {
    if (!content) return null

    return content.split("\n").map((line, index) => {
      // Handle headers
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-gray-900">
            {line.substring(2)}
          </h1>
        )
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-2xl font-semibold mt-6 mb-3 text-gray-800">
            {line.substring(3)}
          </h2>
        )
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-xl font-medium mt-4 mb-2 text-gray-700">
            {line.substring(4)}
          </h3>
        )
      }

      // Handle bold text
      const boldText = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

      // Handle italic text
      const italicText = boldText.replace(/\*(.*?)\*/g, "<em>$1</em>")

      // Handle bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={index} className="ml-4 mb-1 text-gray-700 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: italicText.substring(2) }} />
          </li>
        )
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={index} className="ml-4 mb-1 text-gray-700 leading-relaxed list-decimal">
            <span dangerouslySetInnerHTML={{ __html: italicText.replace(/^\d+\.\s/, "") }} />
          </li>
        )
      }

      // Handle empty lines
      if (line.trim() === "") {
        return <br key={index} />
      }

      // Regular paragraphs
      return (
        <p key={index} className="mb-3 text-gray-700 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: italicText }} />
        </p>
      )
    })
  }

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Document Header */}
      <Card className="mb-8 border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">{document.title}</CardTitle>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className={`${getStatusColor(document.status)} font-medium`}>
                    {getStatusIcon(document.status)}
                    <span className="ml-1 capitalize">{document.status.replace("_", " ")}</span>
                  </Badge>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {new Date(document.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview Mode
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gray-900 hover:bg-gray-800">
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

        {/* Document Metadata */}
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Created by</span>
              <span className="font-medium">{document.created_by || "System"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Organization</span>
              <span className="font-medium">{document.organization || "Default"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Sections</span>
              <span className="font-medium">{sections.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Content */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-0">
          <ScrollArea className="h-[800px]">
            <div className="p-12 bg-white">
              {/* Document Title */}
              <div className="text-center mb-12 pb-8 border-b border-gray-200">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{document.title}</h1>
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <span>Document ID: {document.id}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Status: {document.status.replace("_", " ").toUpperCase()}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{new Date(document.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Document Sections */}
              <div className="space-y-8">
                {sections.map((section, index) => (
                  <div key={section.id} className="section">
                    {/* Section Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {index + 1}
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-800">{section.title}</h2>
                      {section.is_locked && (
                        <Badge variant="outline" className="text-xs">
                          Locked
                        </Badge>
                      )}
                    </div>

                    {/* Section Content */}
                    <div className="ml-11 prose prose-gray max-w-none">
                      {section.content ? (
                        <div className="text-gray-700 leading-relaxed">{renderContent(section.content)}</div>
                      ) : (
                        <div className="text-gray-400 italic py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                          This section is empty
                        </div>
                      )}
                    </div>

                    {/* Section Separator */}
                    {index < sections.length - 1 && <Separator className="mt-8 mb-0" />}
                  </div>
                ))}
              </div>

              {/* Document Footer */}
              <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Generated on {new Date().toLocaleDateString()} • Document Management System</p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
