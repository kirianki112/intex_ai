"use client"

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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles, FileText, BookOpen } from "lucide-react"
import { apiService } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface AIGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId?: string
  sectionId?: string
  sectionTitle?: string
  onSuccess?: () => void
}

export function AIGenerationDialog({
  open,
  onOpenChange,
  documentId,
  sectionId,
  sectionTitle,
  onSuccess,
}: AIGenerationDialogProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const isDocumentGeneration = documentId && !sectionId
  const isSectionGeneration = sectionId

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt for AI generation.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      if (isDocumentGeneration && documentId) {
        await apiService.generateAllSections(documentId, prompt)
        toast({
          title: "Document Generation Started",
          description: "AI is generating content for all sections. This may take a few moments.",
        })
      } else if (isSectionGeneration && sectionId) {
        await apiService.generateSection(sectionId, prompt)
        toast({
          title: "Section Generation Started",
          description: `AI is generating content for "${sectionTitle}". This may take a few moments.`,
        })
      }

      onSuccess?.()
      onOpenChange(false)
      setPrompt("")
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false)
      setPrompt("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {isDocumentGeneration ? "Generate Document Content" : "Generate Section Content"}
          </DialogTitle>
          <DialogDescription>
            {isDocumentGeneration
              ? "Provide a prompt to generate content for all sections in this document using AI."
              : `Provide a prompt to generate content for the "${sectionTitle}" section using AI.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            {isDocumentGeneration ? (
              <FileText className="h-4 w-4 text-blue-600" />
            ) : (
              <BookOpen className="h-4 w-4 text-blue-600" />
            )}
            <span className="text-sm text-blue-800">
              {isDocumentGeneration
                ? "This will generate content for all sections in the document"
                : `This will generate content for the "${sectionTitle}" section`}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Generation Prompt</Label>
            <Textarea
              id="prompt"
              placeholder={
                isDocumentGeneration
                  ? "Describe what you want the document to contain. Be specific about the content, tone, and structure you're looking for..."
                  : `Describe what you want this section to contain. Be specific about the content and approach for "${sectionTitle}"...`
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              disabled={isGenerating}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Be specific about the content, tone, and format you want. The more detailed your prompt, the better
              the AI-generated content will be.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
