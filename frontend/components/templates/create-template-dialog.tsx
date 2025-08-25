"use client"

import type React from "react"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, FileText } from "lucide-react"
import { apiService, type CreateTemplateData } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTemplateCreated: () => void
}

interface TemplateSection {
  key: string
  title: string
  description?: string
  order: number
}

export function CreateTemplateDialog({ open, onOpenChange, onTemplateCreated }: CreateTemplateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sections, setSections] = useState<TemplateSection[]>([])
  const [newSectionKey, setNewSectionKey] = useState("")
  const [newSectionTitle, setNewSectionTitle] = useState("")
  const [newSectionDescription, setNewSectionDescription] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setLoading(true)

      const structure = sections.reduce(
        (acc, section) => {
          acc[section.key] = {
            title: section.title,
            description: section.description,
            order: section.order,
          }
          return acc
        },
        {} as Record<string, any>,
      )

      const templateData: CreateTemplateData = {
        name: name.trim(),
        description: description.trim() || undefined,
        structure,
      }

      await apiService.createTemplate(templateData)

      toast({
        title: "Success",
        description: "Template created successfully",
      })

      // Reset form
      setName("")
      setDescription("")
      setSections([])
      onTemplateCreated()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addSection = () => {
    if (!newSectionKey.trim() || !newSectionTitle.trim()) return

    const section: TemplateSection = {
      key: newSectionKey.trim(),
      title: newSectionTitle.trim(),
      description: newSectionDescription.trim() || undefined,
      order: sections.length + 1,
    }

    setSections([...sections, section])
    setNewSectionKey("")
    setNewSectionTitle("")
    setNewSectionDescription("")
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Create Document Template
          </DialogTitle>
          <DialogDescription>Create a reusable template with predefined sections for your documents.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Project Proposal Template"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this template is used for..."
                rows={3}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.length > 0 && (
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{section.key}</Badge>
                          <span className="font-medium">{section.title}</span>
                        </div>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSection(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
                <h4 className="font-medium">Add Section</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="sectionKey">Section Key</Label>
                    <Input
                      id="sectionKey"
                      value={newSectionKey}
                      onChange={(e) => setNewSectionKey(e.target.value)}
                      placeholder="e.g., executive_summary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sectionTitle">Section Title</Label>
                    <Input
                      id="sectionTitle"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="e.g., Executive Summary"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sectionDescription">Description (Optional)</Label>
                  <Input
                    id="sectionDescription"
                    value={newSectionDescription}
                    onChange={(e) => setNewSectionDescription(e.target.value)}
                    placeholder="Brief description of this section..."
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSection}
                  disabled={!newSectionKey.trim() || !newSectionTitle.trim()}
                  className="w-full bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
