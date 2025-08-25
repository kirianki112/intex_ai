"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Save, FileText, ExternalLink } from "lucide-react"
import { apiService, type DocumentSection, type KnowledgeDocument, type DocumentCitation } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface EditCitationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  citation: DocumentCitation
  onSuccess?: () => void
}

export function EditCitationDialog({ open, onOpenChange, citation, onSuccess }: EditCitationDialogProps) {
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [kbDocuments, setKbDocuments] = useState<KnowledgeDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const [citationType, setCitationType] = useState<"kb_document" | "external">(
    citation.kb_document ? "kb_document" : "external",
  )
  const [formData, setFormData] = useState({
    section: citation.section,
    marker: citation.marker,
    reference_text: citation.reference_text,
    kb_document: citation.kb_document || "",
    external_url: citation.external_url || "",
    confidence_score: citation.confidence_score?.toString() || "",
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [documentsData] = await Promise.all([apiService.getDocuments()])
      setKbDocuments(documentsData.filter((doc) => doc.status === "ready"))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!formData.marker || !formData.reference_text) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (citationType === "kb_document" && !formData.kb_document) {
      toast({
        title: "Missing Knowledge Base Document",
        description: "Please select a knowledge base document.",
        variant: "destructive",
      })
      return
    }

    if (citationType === "external" && !formData.external_url) {
      toast({
        title: "Missing External URL",
        description: "Please enter an external URL.",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const updateData = {
        section: formData.section,
        marker: formData.marker,
        reference_text: formData.reference_text,
        ...(citationType === "kb_document" && { kb_document: formData.kb_document, external_url: null }),
        ...(citationType === "external" && { external_url: formData.external_url, kb_document: null }),
        ...(formData.confidence_score && { confidence_score: Number.parseFloat(formData.confidence_score) }),
      }

      await apiService.updateCitation(citation.id, updateData)
      toast({
        title: "Citation Updated",
        description: "Citation has been updated successfully.",
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update citation",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    if (!isUpdating) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Edit Citation
          </DialogTitle>
          <DialogDescription>Update the citation details and references.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marker">Citation Marker *</Label>
                <Input
                  id="marker"
                  placeholder="e.g., [1], (Smith, 2023)"
                  value={formData.marker}
                  onChange={(e) => setFormData({ ...formData, marker: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidence_score">Confidence Score (0-1)</Label>
                <Input
                  id="confidence_score"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  placeholder="0.8"
                  value={formData.confidence_score}
                  onChange={(e) => setFormData({ ...formData, confidence_score: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_text">Reference Text *</Label>
              <Textarea
                id="reference_text"
                placeholder="Enter the text that describes this citation..."
                value={formData.reference_text}
                onChange={(e) => setFormData({ ...formData, reference_text: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Citation Type</Label>
              <RadioGroup
                value={citationType}
                onValueChange={(value: "kb_document" | "external") => setCitationType(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="kb_document" id="kb_document" />
                  <Label htmlFor="kb_document" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Knowledge Base Document
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="external" id="external" />
                  <Label htmlFor="external" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    External URL
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {citationType === "kb_document" ? (
              <div className="space-y-2">
                <Label htmlFor="kb_document">Knowledge Base Document *</Label>
                <Select
                  value={formData.kb_document}
                  onValueChange={(value) => setFormData({ ...formData, kb_document: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document" />
                  </SelectTrigger>
                  <SelectContent>
                    {kbDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="external_url">External URL *</Label>
                <Input
                  id="external_url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.external_url}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating || isLoading}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Citation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
