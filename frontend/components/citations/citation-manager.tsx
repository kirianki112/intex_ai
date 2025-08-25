"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, BookOpen, FileText, Trash2, Edit } from "lucide-react"
import { apiService, type CitationGroup, type DocumentCitation } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { CreateCitationDialog } from "./create-citation-dialog"
import { EditCitationDialog } from "./edit-citation-dialog"

interface CitationManagerProps {
  documentId: string
}

export function CitationManager({ documentId }: CitationManagerProps) {
  const [citationGroups, setCitationGroups] = useState<CitationGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCitation, setEditingCitation] = useState<DocumentCitation | null>(null)

  useEffect(() => {
    loadCitations()
  }, [documentId])

  const loadCitations = async () => {
    try {
      const groups = await apiService.getDocumentCitations(documentId)
      setCitationGroups(groups)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load citations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCitation = async (citationId: string) => {
    try {
      await apiService.deleteCitation(citationId)
      toast({
        title: "Citation Deleted",
        description: "Citation has been removed successfully.",
      })
      loadCitations()
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete citation",
        variant: "destructive",
      })
    }
  }

  const handleEditCitation = async (citationId: string) => {
    try {
      const citation = await apiService.getCitation(citationId)
      setEditingCitation(citation)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load citation details",
        variant: "destructive",
      })
    }
  }

  const getConfidenceColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800"
    if (score >= 0.8) return "bg-green-100 text-green-800"
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getConfidenceLabel = (score: number | null) => {
    if (!score) return "Unknown"
    if (score >= 0.8) return "High"
    if (score >= 0.6) return "Medium"
    return "Low"
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Citations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Citations ({citationGroups.reduce((acc, group) => acc + group.chunks_used.length, 0)})
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Citation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {citationGroups.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No citations found for this document.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Citation
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-6">
                {citationGroups.map((group) => (
                  <div key={group.kb_document_id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium">{group.document_title}</h3>
                      <Badge variant="outline">{group.chunks_used.length} citations</Badge>
                    </div>

                    <div className="space-y-2 ml-6">
                      {group.chunks_used.map((chunk) => (
                        <Card key={chunk.citation_id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {chunk.marker}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">Section {chunk.section_id}</span>
                                  {chunk.confidence_score && (
                                    <Badge className={getConfidenceColor(chunk.confidence_score)}>
                                      {getConfidenceLabel(chunk.confidence_score)} (
                                      {Math.round(chunk.confidence_score * 100)}%)
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Chunk {chunk.chunk_index + 1} from {group.document_title}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditCitation(chunk.citation_id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCitation(chunk.citation_id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {group !== citationGroups[citationGroups.length - 1] && <Separator className="my-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <CreateCitationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        documentId={documentId}
        onSuccess={loadCitations}
      />

      {editingCitation && (
        <EditCitationDialog
          open={!!editingCitation}
          onOpenChange={() => setEditingCitation(null)}
          citation={editingCitation}
          onSuccess={loadCitations}
        />
      )}
    </>
  )
}
