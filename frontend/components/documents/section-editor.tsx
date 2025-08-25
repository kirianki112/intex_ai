"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, MoreVertical, Sparkles, Save, Undo2, Lock } from "lucide-react"
import { apiService, type DocumentSection } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { AIGenerationDialog } from "./ai-generation-dialog"

interface SectionEditorProps {
  section: DocumentSection
  onSectionUpdate: (section: DocumentSection) => void
}

export function SectionEditor({ section, onSectionUpdate }: SectionEditorProps) {
  const [content, setContent] = useState(section.content)
  const [isSaving, setIsSaving] = useState(false)
  const [isUndoing, setIsUndoing] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    setContent(section.content)
    setHasUnsavedChanges(false)
  }, [section.content])

  useEffect(() => {
    setHasUnsavedChanges(content !== section.content)
  }, [content, section.content])

  const handleSave = async () => {
    if (!hasUnsavedChanges) return

    setIsSaving(true)
    try {
      await apiService.editSection(section.id, {
        content,
        ai_generated: false,
      })

      const updatedSection = { ...section, content }
      onSectionUpdate(updatedSection)
      setHasUnsavedChanges(false)

      toast({
        title: "Section Saved",
        description: `"${section.title}" has been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save section",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUndo = async () => {
    setIsUndoing(true)
    try {
      await apiService.undoSectionEdit(section.id)

      // Refresh section data
      const updatedSection = await apiService.getDocumentSection(section.id)
      onSectionUpdate(updatedSection)
      setContent(updatedSection.content)

      toast({
        title: "Changes Undone",
        description: `"${section.title}" has been reverted to the previous version.`,
      })
    } catch (error) {
      toast({
        title: "Undo Failed",
        description: error instanceof Error ? error.message : "Failed to undo changes",
        variant: "destructive",
      })
    } finally {
      setIsUndoing(false)
    }
  }

  const handleAIGeneration = async () => {
    // Refresh section data after AI generation
    try {
      const updatedSection = await apiService.getDocumentSection(section.id)
      onSectionUpdate(updatedSection)
      setContent(updatedSection.content)
    } catch (error) {
      console.error("Failed to refresh section after AI generation:", error)
    }
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{section.title}</CardTitle>
              {section.is_locked && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Unsaved Changes
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Button size="sm" onClick={handleSave} disabled={isSaving || section.is_locked}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowAIDialog(true)} disabled={section.is_locked}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleUndo} disabled={isUndoing || section.is_locked}>
                    {isUndoing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Undoing...
                      </>
                    ) : (
                      <>
                        <Undo2 className="mr-2 h-4 w-4" />
                        Undo Changes
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Enter content for ${section.title}...`}
            rows={8}
            disabled={section.is_locked}
            className="resize-none"
          />
          {section.is_locked && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              This section is locked and cannot be edited.
            </p>
          )}
        </CardContent>
      </Card>

      <AIGenerationDialog
        open={showAIDialog}
        onOpenChange={setShowAIDialog}
        sectionId={section.id}
        sectionTitle={section.title}
        onSuccess={handleAIGeneration}
      />
    </>
  )
}
