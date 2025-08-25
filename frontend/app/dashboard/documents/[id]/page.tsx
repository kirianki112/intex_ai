"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { EnhancedDocumentEditor } from "@/components/documents/enhanced-document-editor"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DocumentEditorPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-screen flex flex-col">
          <div className="border-b bg-background p-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/projects")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>

          <div className="flex-1">
            <EnhancedDocumentEditor documentId={documentId} />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
