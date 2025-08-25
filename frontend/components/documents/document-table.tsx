"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type KnowledgeDocument, apiService } from "@/lib/api"
import { MoreHorizontal, Download, RefreshCw, Trash2, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface DocumentTableProps {
  documents: KnowledgeDocument[]
  onDocumentDeleted?: () => void
  onDocumentReindexed?: () => void
}

export function DocumentTable({ documents, onDocumentDeleted, onDocumentReindexed }: DocumentTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null)
  const [reindexingIds, setReindexingIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const getStatusBadge = (status: KnowledgeDocument["status"]) => {
    switch (status) {
      case "ready":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        )
      case "uploaded":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Uploaded
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDownload = (document: KnowledgeDocument) => {
    window.open(document.file, "_blank")
  }

  const handleReindex = async (document: KnowledgeDocument) => {
    setReindexingIds((prev) => new Set(prev).add(document.id))
    try {
      await apiService.reindexDocument(document.id)
      toast({
        title: "Success",
        description: "Document reindexing started",
      })
      onDocumentReindexed?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start reindexing",
        variant: "destructive",
      })
    } finally {
      setReindexingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(document.id)
        return newSet
      })
    }
  }

  const handleDelete = (document: KnowledgeDocument) => {
    setSelectedDocument(document)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedDocument) return

    try {
      await apiService.deleteDocument(selectedDocument.id)
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
      onDocumentDeleted?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedDocument(null)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No documents yet</h3>
        <p className="text-muted-foreground">Upload your first document to get started</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Pages</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{document.title}</TableCell>
              <TableCell>{getStatusBadge(document.status)}</TableCell>
              <TableCell className="text-muted-foreground">
                {document.mime_type.split("/")[1]?.toUpperCase() || "Unknown"}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatFileSize(document.size_bytes)}</TableCell>
              <TableCell className="text-muted-foreground">{document.pages || "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownload(document)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReindex(document)} disabled={reindexingIds.has(document.id)}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${reindexingIds.has(document.id) ? "animate-spin" : ""}`} />
                      Reindex
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(document)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document{" "}
              <strong>{selectedDocument?.title}</strong> and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
