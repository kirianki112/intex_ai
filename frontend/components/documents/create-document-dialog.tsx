"use client"

import type React from "react"

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
import { FileText } from "lucide-react"
import { apiService, type CreateDocumentData, type DocumentTemplate } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CreateDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDocumentCreated: () => void
}

export function CreateDocumentDialog({ open, onOpenChange, onDocumentCreated }: CreateDocumentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [title, setTitle] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none")
  const [prompt, setPrompt] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open])

  const loadTemplates = async () => {
    try {
      const data = await apiService.getTemplates()
      setTemplates(data)
    } catch (error) {
      console.error("Failed to load templates:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setLoading(true)

      const documentData: CreateDocumentData = {
        title: title.trim(),
        template: selectedTemplate === "none" ? null : selectedTemplate,
        meta: prompt.trim() ? { prompt: prompt.trim() } : {},
      }

      await apiService.createProjectDocument(documentData)

      toast({
        title: "Success",
        description: "Document created successfully",
      })

      // Reset form
      setTitle("")
      setSelectedTemplate("none")
      setPrompt("")
      onDocumentCreated()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Create Document
          </DialogTitle>
          <DialogDescription>Create a new document from scratch or using a template.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q1 2024 Project Proposal"
              required
            />
          </div>

          <div>
            <Label htmlFor="template">Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="prompt">AI Generation Prompt (Optional)</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what this document should contain for AI generation..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
