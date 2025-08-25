import { type User, authService } from "./auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface Role {
  id: string
  name: string
  description: string | null
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  roles: string[]
}

export interface UpdateUserData {
  email?: string
  is_active?: boolean
  profile?: {
    full_name?: string
    job_title?: string
    phone_number?: string
    bio?: string
    location?: string
    linkedin?: string
    github?: string
  }
}

export interface OrganizationInviteToken {
  id: string
  token: string
  created_by: string
  created_at: string
  expires_at: string
  is_used: boolean
}

export interface UpdateProfileData {
  full_name?: string
  job_title?: string
  phone_number?: string
  bio?: string
  location?: string
  linkedin?: string
  github?: string
}

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  structure: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateTemplateData {
  name: string
  description?: string
  structure?: Record<string, any>
}

export interface UpdateTemplateData {
  name?: string
  description?: string
  structure?: Record<string, any>
}

// Document Management interfaces
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

export interface CreateDocumentData {
  template?: string | null
  title: string
  meta?: Record<string, any>
  status?: "draft" | "in_review" | "approved" | "final"
  organization?: string | null
}

export interface UpdateDocumentData {
  template?: string | null
  title?: string
  meta?: Record<string, any>
  status?: "draft" | "in_review" | "approved" | "final"
  organization?: string | null
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

export interface EditSectionData {
  content: string
  ai_generated?: boolean
  summary?: string | null
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

export interface DocumentCitation {
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

export interface CreateCitationData {
  section: string
  marker: string
  reference_text: string
  kb_document?: string | null
  external_url?: string | null
  snapshot_path?: string | null
  confidence_score?: number | null
  additional_metadata?: Record<string, any>
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

export interface KnowledgeDocument {
  id: string
  title: string
  file: string
  file_name: string
  mime_type: string
  size_bytes: number
  status: "uploaded" | "processing" | "ready" | "failed"
  pages?: number
  created_at: string
  processed_at?: string
}

export interface SearchResult {
  chunk_id: string
  document_id: string
  snippet: string
  score: number
  chunk_index: number
}

export interface SearchResponse {
  results: SearchResult[]
}

export interface ChatSession {
  id: string
  organization: string
  user: string
  title: string
  created_at: string
  updated_at: string
  messages: ChatMessage[]
}

export interface ChatMessage {
  id: string
  session: string
  role: "user" | "assistant" | "system"
  content: string
  citations?: Citation[]
  created_at: string
}

export interface Citation {
  text: string
  source: string
  score: number
}

export interface ChatResponse {
  answer: string
  citations: Citation[]
  assistant_message_id: string
}

class ApiService {
  private async getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      if (response.status === 401) {
        try {
          await authService.refreshToken()
          // Retry the request would need to be handled by the caller
          throw new Error("Token refreshed, please retry")
        } catch {
          authService.logout()
          throw new Error("Authentication failed")
        }
      }
      const error = await response.json().catch(() => ({ detail: "Request failed" }))
      throw new Error(error.detail || `Request failed with status ${response.status}`)
    }
    return response.json()
  }

  // User Management
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/users/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/users/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/users/${userId}/`, {
      method: "PATCH",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/users/${userId}/`, {
      method: "DELETE",
      headers: await this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete user")
    }
  }

  async assignRoles(userId: string, roles: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/users/${userId}/assign-roles/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roles }),
    })
    return this.handleResponse(response)
  }

  // Role Management
  async getRoles(): Promise<Role[]> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/roles/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  // Organization Invite Token Management (Superuser only)
  async getOrganizationTokens(): Promise<OrganizationInviteToken[]> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/org-tokens/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async createOrganizationToken(ttl = 72): Promise<OrganizationInviteToken> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/org-tokens/?ttl=${ttl}`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  // Profile Management
  async updateOwnProfile(profileData: UpdateProfileData) {
    const response = await fetch(`${API_BASE_URL}/api/accounts/profiles/me/`, {
      method: "PATCH",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    })
    return this.handleResponse(response)
  }

  async updateOwnUser(userData: { email?: string }) {
    const response = await fetch(`${API_BASE_URL}/api/accounts/users/me/`, {
      method: "PATCH",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  // Template Management
  async getTemplates(): Promise<DocumentTemplate[]> {
    const response = await fetch(`${API_BASE_URL}/api/documents/templates/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async getTemplate(templateId: string): Promise<DocumentTemplate> {
    const response = await fetch(`${API_BASE_URL}/api/documents/templates/${templateId}/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async createTemplate(templateData: CreateTemplateData): Promise<DocumentTemplate> {
    const response = await fetch(`${API_BASE_URL}/api/documents/templates/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templateData),
    })
    return this.handleResponse(response)
  }

  async updateTemplate(templateId: string, templateData: UpdateTemplateData): Promise<DocumentTemplate> {
    const response = await fetch(`${API_BASE_URL}/api/documents/templates/${templateId}/`, {
      method: "PUT",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templateData),
    })
    return this.handleResponse(response)
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/documents/templates/${templateId}/`, {
      method: "DELETE",
      headers: await this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete template")
    }
  }

  // Knowledge Base API methods
  // Document Management
  async getDocuments(): Promise<KnowledgeDocument[]> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/documents/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async uploadDocument(file: File, title?: string): Promise<KnowledgeDocument> {
    const formData = new FormData()
    formData.append("file", file)
    if (title) {
      formData.append("title", title)
    }

    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/documents/`, {
      method: "POST",
      headers: await this.getAuthHeaders(),
      body: formData,
    })
    return this.handleResponse(response)
  }

  async getDocument(documentId: string): Promise<KnowledgeDocument> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/documents/${documentId}/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/documents/${documentId}/`, {
      method: "DELETE",
      headers: await this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete document")
    }
  }

  async reindexDocument(documentId: string): Promise<{ detail: string }> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/documents/${documentId}/reindex/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  // Document Management
  async getProjectDocuments(): Promise<Document[]> {
    const response = await fetch(`${API_BASE_URL}/api/documents/documents/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async getProjectDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/api/documents/documents/${documentId}/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async createProjectDocument(documentData: CreateDocumentData): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/api/documents/documents/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(documentData),
    })
    return this.handleResponse(response)
  }

  async updateProjectDocument(documentId: string, documentData: UpdateDocumentData): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/api/documents/documents/${documentId}/`, {
      method: "PUT",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(documentData),
    })
    return this.handleResponse(response)
  }

  async deleteProjectDocument(documentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/documents/documents/${documentId}/`, {
      method: "DELETE",
      headers: await this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete document")
    }
  }

  async generateAllSections(documentId: string, prompt?: string): Promise<{ detail: string }> {
    const response = await fetch(`${API_BASE_URL}/api/documents/documents/${documentId}/generate_all/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })
    return this.handleResponse(response)
  }

  async exportDocument(
    documentId: string,
    format: "docx" | "pdf" | "excel",
    options?: Record<string, any>,
  ): Promise<DocumentExport> {
    const response = await fetch(`${API_BASE_URL}/api/documents/documents/${documentId}/export/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ format, options }),
    })
    return this.handleResponse(response)
  }

  async finalizeDocument(documentId: string, success?: boolean | null): Promise<{ detail: string }> {
    const response = await fetch(`${API_BASE_URL}/api/documents/documents/${documentId}/finalize/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success }),
    })
    return this.handleResponse(response)
  }

  // Section Management
  async getDocumentSections(documentId: string): Promise<DocumentSection[]> {
    const response = await fetch(`${API_BASE_URL}/api/documents/sections/?document=${documentId}`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async getDocumentSection(sectionId: string): Promise<DocumentSection> {
    const response = await fetch(`${API_BASE_URL}/api/documents/sections/${sectionId}/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async editSection(sectionId: string, sectionData: EditSectionData): Promise<{ detail: string; version: string }> {
    const response = await fetch(`${API_BASE_URL}/api/documents/sections/${sectionId}/edit/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sectionData),
    })
    return this.handleResponse(response)
  }

  async generateSection(sectionId: string, prompt?: string): Promise<{ detail: string }> {
    const response = await fetch(`${API_BASE_URL}/api/documents/sections/${sectionId}/ai-generate/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })
    return this.handleResponse(response)
  }

  async undoSectionEdit(sectionId: string): Promise<{ detail: string; version: string }> {
    const response = await fetch(`${API_BASE_URL}/api/documents/sections/${sectionId}/undo/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  // Citation Management
  async getDocumentCitations(documentId?: string): Promise<CitationGroup[]> {
    const url = documentId ? `${API_BASE_URL}/api/documents/citations/?document=${documentId}` : `${API_BASE_URL}/api/documents/citations/`

    const response = await fetch(url, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async getCitation(citationId: string): Promise<DocumentCitation> {
    const response = await fetch(`${API_BASE_URL}/api/documents/citations/${citationId}/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async createCitation(citationData: CreateCitationData): Promise<DocumentCitation> {
    const response = await fetch(`${API_BASE_URL}/api/documents/citations/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(citationData),
    })
    return this.handleResponse(response)
  }

  async updateCitation(citationId: string, citationData: Partial<CreateCitationData>): Promise<DocumentCitation> {
    const response = await fetch(`${API_BASE_URL}/api/documents/citations/${citationId}/`, {
      method: "PUT",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(citationData),
    })
    return this.handleResponse(response)
  }

  async deleteCitation(citationId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/documents/citations/${citationId}/`, {
      method: "DELETE",
      headers: await this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete citation")
    }
  }

  // Semantic Search
  async searchDocuments(query: string, topK = 6, documentIds?: string[]): Promise<SearchResponse> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/search/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        top_k: topK,
        document_ids: documentIds,
      }),
    })
    return this.handleResponse(response)
  }

  // Chat Management
  async getChatSessions(): Promise<ChatSession[]> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/chat/sessions/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async createChatSession(title?: string): Promise<ChatSession> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/chat/sessions/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    })
    return this.handleResponse(response)
  }

  async getChatSession(sessionId: string): Promise<ChatSession> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/chat/sessions/${sessionId}/`, {
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
    })
    return this.handleResponse(response)
  }

  async updateChatSession(sessionId: string, title: string): Promise<ChatSession> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/chat/sessions/${sessionId}/`, {
      method: "PATCH",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    })
    return this.handleResponse(response)
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/chat/sessions/${sessionId}/`, {
      method: "DELETE",
      headers: await this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete chat session")
    }
  }

  async sendChatMessage(sessionId: string, question: string, topK = 6): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge_base/chat/sessions/${sessionId}/message/`, {
      method: "POST",
      headers: {
        ...(await this.getAuthHeaders()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        top_k: topK,
      }),
    })
    return this.handleResponse(response)
  }
}

export const apiService = new ApiService()
