"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download, FileText, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import type { DocumentExport } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface ExportStatusTrackerProps {
  documentId: string
}

export function ExportStatusTracker({ documentId }: ExportStatusTrackerProps) {
  const [exports, setExports] = useState<DocumentExport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExports()
    // Poll for export status updates every 5 seconds
    const interval = setInterval(loadExports, 5000)
    return () => clearInterval(interval)
  }, [documentId])

  const loadExports = async () => {
    try {
      // This would need to be implemented in the API service
      // const data = await apiService.getDocumentExports(documentId)
      // setExports(data)
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to load exports:", error)
      setIsLoading(false)
    }
  }

  const handleDownload = async (exportItem: DocumentExport) => {
    if (!exportItem.file) return

    try {
      // Create download link
      const link = document.createElement("a")
      link.href = exportItem.file
      link.download = `document-${documentId}.${exportItem.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download Started",
        description: `Downloading ${exportItem.format.toUpperCase()} file...`,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the exported file",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: DocumentExport["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: DocumentExport["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading exports...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exports.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No exports yet</p>
            <p className="text-sm text-muted-foreground">Export your document to see the history here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exports.map((exportItem) => (
              <div key={exportItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(exportItem.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{exportItem.format.toUpperCase()}</span>
                      <Badge className={getStatusColor(exportItem.status)}>{exportItem.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(exportItem.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {exportItem.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Progress value={65} className="w-20" />
                      <span className="text-sm text-muted-foreground">Processing...</span>
                    </div>
                  )}
                  {exportItem.status === "completed" && exportItem.file && (
                    <Button size="sm" variant="outline" onClick={() => handleDownload(exportItem)}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                  {exportItem.status === "failed" && <span className="text-sm text-red-600">Export failed</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
