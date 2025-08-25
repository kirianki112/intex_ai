import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, FileText, Users, Shield, Brain, CheckCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-muted/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        {/* Navigation */}
        <nav className="relative z-10 border-b border-border/40 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold font-sans text-foreground">DocuFlow</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link href="/onboard">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-muted text-muted-foreground border-border">
              <Brain className="h-3 w-3 mr-1" />
              AI-Powered Document Management
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 font-sans leading-tight">
              Transform Your
              <span className="text-primary block">Document Workflow</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-serif leading-relaxed">
              Enterprise-grade document management with AI-powered insights, seamless collaboration, and intelligent
              automation for modern teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/onboard">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="font-medium px-8 bg-transparent">
                  Sign In to Account
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-primary mr-2" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-primary mr-2" />
                99.9% Uptime
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-primary mr-2" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4 font-sans">
              Everything you need to manage documents
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-serif">
              Powerful features designed for enterprise teams who demand efficiency, security, and intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-muted/80 transition-colors">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-sans text-xl">AI-Powered Insights</CardTitle>
                <CardDescription className="font-serif">
                  Intelligent document analysis, automated summaries, and smart recommendations powered by advanced AI.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-muted/80 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-sans text-xl">Team Collaboration</CardTitle>
                <CardDescription className="font-serif">
                  Real-time collaboration, role-based permissions, and seamless workflow management for distributed
                  teams.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-muted/80 transition-colors">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-sans text-xl">Enterprise Security</CardTitle>
                <CardDescription className="font-serif">
                  Bank-grade encryption, compliance certifications, and granular access controls to protect your data.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      <div className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6 font-sans">
              Ready to transform your document workflow?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 font-serif">
              Join thousands of teams already using DocuFlow to streamline their document management.
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                <CardHeader className="text-center">
                  <CardTitle className="font-sans text-lg">New Organization</CardTitle>
                  <CardDescription className="font-serif">
                    Set up a new organization and invite your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/onboard">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                      Create Organization
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="text-center">
                  <CardTitle className="font-sans text-lg">Existing Account</CardTitle>
                  <CardDescription className="font-serif">Access your account and continue working</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/login">
                    <Button variant="outline" className="w-full font-medium bg-transparent">
                      Sign In to Account
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <FileText className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-semibold font-sans text-foreground">DocuFlow</span>
            </div>
            <p className="text-sm text-muted-foreground font-serif">© 2024 DocuFlow. Enterprise document management.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
