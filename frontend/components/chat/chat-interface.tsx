"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { ChatSidebar } from "./chat-sidebar"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { type ChatSession, type Citation, apiService } from "@/lib/api"
import { MessageSquare, Bot } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [currentSession?.messages])

  const loadSessions = async () => {
    try {
      const sessionsData = await apiService.getChatSessions()
      setSessions(sessionsData)

      // Select the first session if available
      if (sessionsData.length > 0 && !currentSession) {
        setCurrentSession(sessionsData[0])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSessionSelect = async (sessionId: string) => {
    try {
      const session = await apiService.getChatSession(sessionId)
      setCurrentSession(session)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!currentSession) {
      // Create a new session if none exists
      try {
        const newSession = await apiService.createChatSession("New Chat")
        setCurrentSession(newSession)
        setSessions((prev) => [newSession, ...prev])

        // Send the message to the new session
        await sendMessageToSession(newSession.id, message)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create new chat",
          variant: "destructive",
        })
      }
      return
    }

    await sendMessageToSession(currentSession.id, message)
  }

  const sendMessageToSession = async (sessionId: string, message: string) => {
    setSendingMessage(true)

    try {
      // Add user message to UI immediately
      const userMessage = {
        id: `temp-${Date.now()}`,
        session: sessionId,
        role: "user" as const,
        content: message,
        created_at: new Date().toISOString(),
      }

      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, userMessage],
            }
          : null,
      )

      // Send message to API
      const response = await apiService.sendChatMessage(sessionId, message)

      // Add assistant response
      const assistantMessage = {
        id: response.assistant_message_id,
        session: sessionId,
        role: "assistant" as const,
        content: response.answer,
        citations: response.citations,
        created_at: new Date().toISOString(),
      }

      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages.filter((m) => m.id !== userMessage.id), userMessage, assistantMessage],
            }
          : null,
      )

      // Refresh sessions to update the session list
      loadSessions()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })

      // Remove the temporary user message on error
      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.filter((m) => !m.id.startsWith("temp-")),
            }
          : null,
      )
    } finally {
      setSendingMessage(false)
    }
  }

  const handleCitationClick = (citation: Citation) => {
    // TODO: Navigate to document or show document details
    toast({
      title: "Citation",
      description: `Source document: ${citation.source}`,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSession?.id}
        onSessionSelect={handleSessionSelect}
        onSessionsChange={loadSessions}
      />

      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">{currentSession.title}</h2>
              <p className="text-sm text-muted-foreground">
                {currentSession.messages.length} message{currentSession.messages.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              {currentSession.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                      <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                      <p className="text-muted-foreground">
                        Ask questions about your documents and I'll help you find answers with relevant citations.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentSession.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} onCitationClick={handleCitationClick} />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <ChatInput onSendMessage={handleSendMessage} loading={sendingMessage} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No chat selected</h3>
                <p className="text-muted-foreground">
                  Select a chat from the sidebar or create a new one to get started.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
