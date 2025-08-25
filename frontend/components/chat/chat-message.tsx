"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { ChatMessage as ChatMessageModel, Citation } from "@/lib/api"
import { User, Bot, FileText, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ChatMessageProps {
  message: ChatMessageModel
  onCitationClick?: (citation: Citation) => void
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start space-x-3`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-primary text-primary-foreground ml-3" : "bg-muted text-muted-foreground mr-3"
          }`}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-2">
          <Card className={isUser ? "bg-primary text-primary-foreground" : "bg-muted/50"}>
            <CardContent className="p-3">
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-2 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </div>
            </CardContent>
          </Card>

          {/* Citations */}
          {isAssistant && message.citations && message.citations.length > 0 && (
            <Card className="bg-background border-l-4 border-l-primary">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sources</span>
                </div>
                <div className="space-y-2">
                  {message.citations.map((citation, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          Source {index + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {Math.max(0, (1 - citation.score) * 100).toFixed(1)}% match
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2 rounded">
                        {citation.text.length > 200 ? `${citation.text.substring(0, 200)}...` : citation.text}
                      </div>
                      {onCitationClick && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => onCitationClick(citation)}
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View Document
                        </Button>
                      )}
                      {index < message.citations.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
