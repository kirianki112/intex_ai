import { TemplateTable } from "@/components/templates/template-table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function TemplatesPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="border-b border-border pb-6">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Document Templates
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Create and manage reusable document templates with predefined sections and AI-powered content generation.
            </p>
          </div>

          <TemplateTable />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
