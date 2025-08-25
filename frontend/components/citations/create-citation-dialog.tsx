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
import { Loader2, Plus, FileText, ExternalLink } from "lucide-react"
import { apiService, type DocumentSection, type KnowledgeDocument, type CreateCitationData } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface CreateCitationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  onSuccess?: () => void
}

export function CreateCitationDialog({ open, onOpenChange, documentId, onSuccess }: CreateCitationDialogProps) {
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [kbDocuments, setKbDocuments] = useState<KnowledgeDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [citationType, setCitationType] = useState<"kb_document" | "external">("kb_document")
  const [formData, setFormData] = useState({
    section: "",
    marker: "",
    reference_text: "",
    kb_document: "",
    external_url: "",
    confidence_score: "",
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, documentId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [sectionsData, documentsData] = await Promise.all([
        apiService.getDocumentSections(documentId),
        apiService.getDocuments(),
      ])
      setSections(sectionsData.sort((a, b) => a.order - b.order))
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

  const handleCreate = async () => {
    if (!formData.section || !formData.marker || !formData.reference_text) {
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

    setIsCreating(true)
    try {
      const citationData: CreateCitationData = {
        section: formData.section,
        marker: formData.marker,
        reference_text: formData.reference_text,
        ...(citationType === "kb_document" && { kb_document: formData.kb_document }),
        ...(citationType === "external" && { external_url: formData.external_url }),
        ...(formData.confidence_score && { confidence_score: Number.parseFloat(formData.confidence_score) }),
      }

      await apiService.createCitation(citationData)
      toast({
        title: "Citation Created",
        description: "Citation has been added successfully.",
      })

      onSuccess?.()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create citation",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setFormData({
      section: "",
      marker: "",
      reference_text: "",
      kb_document: "",
      external_url: "",
      confidence_score: "",
    })
    setCitationType("kb_document")
  }

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false)
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Citation
          </DialogTitle>
          <DialogDescription>
            Create a new citation to reference external sources or knowledge base documents.
          </DialogDescription>
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
                <Label htmlFor="section">Section *</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) => setFormData({ ...formData, section: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marker">Citation Marker *</Label>
                <Input
                  id="marker"
                  placeholder="e.g., [1], (Smith, 2023)"
                  value={formData.marker}
                  onChange={(e) => setFormData({ ...formData, marker: e.target.value })}
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
              <p className="text-xs text-muted-foreground">
                Optional: Rate the reliability of this citation (0 = low, 1 = high)
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || isLoading}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Citation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
