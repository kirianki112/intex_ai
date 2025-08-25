"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { type KnowledgeDocument, type SearchResult, apiService } from "@/lib/api"
import { Search, FileText, Zap, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SearchInterfaceProps {
  documents: KnowledgeDocument[]
}

export function SearchInterface({ documents }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [topK, setTopK] = useState(6)
  const [hasSearched, setHasSearched] = useState(false)
  const { toast } = useToast()

  const readyDocuments = documents.filter((doc) => doc.status === "ready")

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      const response = await apiService.searchDocuments(
        query,
        topK,
        selectedDocuments.length > 0 ? selectedDocuments : undefined,
      )
      setResults(response.results)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search documents",
        variant: "destructive",
      })
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const toggleDocumentFilter = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId) ? prev.filter((id) => id !== documentId) : [...prev, documentId],
    )
  }

  const clearFilters = () => {
    setSelectedDocuments([])
  }

  const getDocumentTitle = (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId)
    return doc?.title || "Unknown Document"
  }

  const formatScore = (score: number) => {
    // Convert cosine distance to similarity percentage (lower distance = higher similarity)
    const similarity = Math.max(0, (1 - score) * 100)
    return `${similarity.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Semantic Search
          </CardTitle>
          <CardDescription>Search across your documents using AI-powered semantic understanding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Ask a question or search for information..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-base"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {/* Search Options */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <label htmlFor="topK" className="text-muted-foreground">
                Results:
              </label>
              <Select value={topK.toString()} onValueChange={(value) => setTopK(Number.parseInt(value))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDocuments.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  <Filter className="mr-1 h-3 w-3" />
                  {selectedDocuments.length} document{selectedDocuments.length !== 1 ? "s" : ""} selected
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Filters */}
      {readyDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter by Documents</CardTitle>
            <CardDescription>Select specific documents to search within</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {readyDocuments.map((document) => (
                <div key={document.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={document.id}
                    checked={selectedDocuments.includes(document.id)}
                    onCheckedChange={() => toggleDocumentFilter(document.id)}
                  />
                  <label
                    htmlFor={document.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {document.title}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {loading
                ? "Searching..."
                : results.length > 0
                  ? `Found ${results.length} relevant result${results.length !== 1 ? "s" : ""}`
                  : "No results found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={result.chunk_id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{getDocumentTitle(result.document_id)}</span>
                          <Badge variant="outline" className="text-xs">
                            Chunk {result.chunk_index + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {formatScore(result.score)} match
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{result.snippet}</div>
                      </div>
                    </div>
                    {index < results.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="text-center py-8">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query or check if your documents are ready
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      {!hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Ask natural language questions: "What is the project timeline?"</p>
            <p>• Search for concepts: "budget planning" or "risk management"</p>
            <p>• Use specific terms: "Q1 2025" or "marketing strategy"</p>
            <p>• Filter by documents to narrow your search scope</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
