"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { type ChatSession, apiService } from "@/lib/api"
import { Plus, MessageSquare, MoreHorizontal, Edit2, Trash2, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId?: string
  onSessionSelect: (sessionId: string) => void
  onSessionsChange: () => void
}

export function ChatSidebar({ sessions, currentSessionId, onSessionSelect, onSessionsChange }: ChatSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null)
  const { toast } = useToast()

  const handleNewChat = async () => {
    try {
      const newSession = await apiService.createChatSession("New Chat")
      onSessionsChange()
      onSessionSelect(newSession.id)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      })
    }
  }

  const handleEditStart = (session: ChatSession) => {
    setEditingSessionId(session.id)
    setEditTitle(session.title)
  }

  const handleEditSave = async () => {
    if (!editingSessionId || !editTitle.trim()) return

    try {
      await apiService.updateChatSession(editingSessionId, editTitle.trim())
      setEditingSessionId(null)
      setEditTitle("")
      onSessionsChange()
      toast({
        title: "Success",
        description: "Chat title updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive",
      })
    }
  }

  const handleEditCancel = () => {
    setEditingSessionId(null)
    setEditTitle("")
  }

  const handleDeleteStart = (session: ChatSession) => {
    setSessionToDelete(session)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return

    try {
      await apiService.deleteChatSession(sessionToDelete.id)
      onSessionsChange()
      if (currentSessionId === sessionToDelete.id) {
        // If we deleted the current session, select the first available session
        const remainingSessions = sessions.filter((s) => s.id !== sessionToDelete.id)
        if (remainingSessions.length > 0) {
          onSessionSelect(remainingSessions[0].id)
        }
      }
      toast({
        title: "Success",
        description: "Chat deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
    }
  }

  const truncateTitle = (title: string, maxLength = 25) => {
    return title.length > maxLength ? title.substring(0, maxLength) + "..." : title
  }

  return (
    <>
      <div className="w-64 border-r border-border bg-muted/30 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Button onClick={handleNewChat} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Sessions List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative rounded-md p-3 cursor-pointer transition-colors ${
                  currentSessionId === session.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                }`}
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {editingSessionId === session.id ? (
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-6 text-xs"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") handleEditSave()
                            if (e.key === "Escape") handleEditCancel()
                          }}
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={handleEditSave} className="h-6 w-6 p-0">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleEditCancel} className="h-6 w-6 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{truncateTitle(session.title)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                        </p>
                      </>
                    )}
                  </div>

                  {editingSessionId !== session.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditStart(session)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteStart(session)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No chats yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sessionToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
