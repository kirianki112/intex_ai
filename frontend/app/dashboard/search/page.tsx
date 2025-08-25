"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SearchInterface } from "@/components/search/search-interface"
import { type KnowledgeDocument, apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function SearchPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const documentsData = await apiService.getDocuments()
      setDocuments(documentsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-sans">Search</h1>
              <p className="text-muted-foreground">Search across your knowledge base with AI</p>
            </div>
          </div>

          {/* Search Interface */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <SearchInterface documents={documents} />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
