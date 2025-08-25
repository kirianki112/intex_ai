"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, FileText, Settings } from "lucide-react"
import { apiService } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface EnhancedExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentTitle: string
}

export function EnhancedExportDialog({ open, onOpenChange, documentId, documentTitle }: EnhancedExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<"docx" | "pdf" | "excel">("docx")
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    includeCitations: true,
    includeMetadata: true,
    includeTableOfContents: true,
    customFooter: "",
    pageOrientation: "portrait" as "portrait" | "landscape",
    fontSize: "12",
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await apiService.exportDocument(documentId, selectedFormat, exportOptions)

      toast({
        title: "Export Started",
        description: `Your document "${documentTitle}" is being exported as ${selectedFormat.toUpperCase()}. You'll be notified when it's ready.`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to start export",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatDescriptions = {
    docx: "Microsoft Word format - Best for editing and collaboration",
    pdf: "Portable Document Format - Best for sharing and printing",
    excel: "Microsoft Excel format - Best for data analysis and reporting",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Document
          </DialogTitle>
          <DialogDescription>Configure export settings for "{documentTitle}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedFormat}
                onValueChange={(value: "docx" | "pdf" | "excel") => setSelectedFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="docx">DOCX - Microsoft Word</SelectItem>
                  <SelectItem value="pdf">PDF - Portable Document</SelectItem>
                  <SelectItem value="excel">XLSX - Microsoft Excel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{formatDescriptions[selectedFormat]}</p>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="citations"
                    checked={exportOptions.includeCitations}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeCitations: checked as boolean })
                    }
                  />
                  <Label htmlFor="citations">Include Citations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeMetadata: checked as boolean })
                    }
                  />
                  <Label htmlFor="metadata">Include Metadata</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="toc"
                    checked={exportOptions.includeTableOfContents}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeTableOfContents: checked as boolean })
                    }
                  />
                  <Label htmlFor="toc">Table of Contents</Label>
                </div>
              </div>

              {selectedFormat === "pdf" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orientation">Page Orientation</Label>
                    <Select
                      value={exportOptions.pageOrientation}
                      onValueChange={(value: "portrait" | "landscape") =>
                        setExportOptions({ ...exportOptions, pageOrientation: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select
                      value={exportOptions.fontSize}
                      onValueChange={(value) => setExportOptions({ ...exportOptions, fontSize: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10pt</SelectItem>
                        <SelectItem value="11">11pt</SelectItem>
                        <SelectItem value="12">12pt</SelectItem>
                        <SelectItem value="14">14pt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="footer">Custom Footer (Optional)</Label>
                <Textarea
                  id="footer"
                  placeholder="Enter custom footer text..."
                  value={exportOptions.customFooter}
                  onChange={(e) => setExportOptions({ ...exportOptions, customFooter: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-pulse" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
