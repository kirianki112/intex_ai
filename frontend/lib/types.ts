export interface DocumentTemplate {
  id: string
  name: string
  description: string
  structure: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  template: string | null
  title: string
  meta: Record<string, any>
  created_by: string
  organization: string | null
  status: "draft" | "in_review" | "approved" | "final"
  finalized_at: string | null
  success: boolean | null
  created_at: string
  updated_at: string
}

export interface DocumentSection {
  id: string
  document: string
  key: string
  title: string
  order: number
  is_locked: boolean
  content: string
}

export interface DocumentSectionVersion {
  id: string
  section: string
  content: string
  ai_generated: boolean
  summary: string | null
  created_at: string
  updated_at: string
}

export interface Citation {
  id: string
  section: string
  marker: string
  reference_text: string
  kb_document: string | null
  external_url: string | null
  snapshot_path: string | null
  confidence_score: number | null
  additional_metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CitationGroup {
  kb_document_id: string
  document_title: string
  chunks_used: Array<{
    chunk_index: number
    marker: string
    section_id: string
    confidence_score: number | null
    citation_id: string
  }>
}

export interface DocumentExport {
  id: string
  document: string
  requested_by: string
  format: "docx" | "pdf" | "excel"
  options: Record<string, any>
  file: string | null
  status: "pending" | "completed" | "failed"
  created_at: string
  updated_at: string
}

// Request/Response types
export interface CreateDocumentRequest {
  template?: string | null
  title: string
  meta?: Record<string, any>
  status?: "draft" | "in_review" | "approved" | "final"
  organization?: string | null
}

export interface UpdateDocumentRequest {
  template?: string | null
  title?: string
  meta?: Record<string, any>
  status?: "draft" | "in_review" | "approved" | "final"
  organization?: string | null
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  structure?: Record<string, any>
}

export interface UpdateTemplateRequest {
  name?: string
  description?: string
  structure?: Record<string, any>
}

export interface EditSectionRequest {
  content: string
  ai_generated?: boolean
  summary?: string | null
}

export interface GenerateContentRequest {
  prompt?: string | null
}

export interface ExportDocumentRequest {
  format: "docx" | "pdf" | "excel"
  options?: Record<string, any>
}

export interface FinalizeDocumentRequest {
  success?: boolean | null
}

export interface CreateCitationRequest {
  section: string
  marker: string
  reference_text: string
  kb_document?: string | null
  external_url?: string | null
  snapshot_path?: string | null
  confidence_score?: number | null
  additional_metadata?: Record<string, any>
}

export interface UpdateCitationRequest {
  section?: string
  marker?: string
  reference_text?: string
  kb_document?: string | null
  external_url?: string | null
  snapshot_path?: string | null
  confidence_score?: number | null
  additional_metadata?: Record<string, any>
}
