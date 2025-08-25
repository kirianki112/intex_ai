"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { MapPin, Phone, Linkedin, Github, Mail, ExternalLink } from "lucide-react"

export function ProfilePreview() {
  const { user } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Preview</CardTitle>
        <CardDescription>How your profile appears to other users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profile.avatar || ""} alt={user.profile.full_name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {getInitials(user.profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-semibold">{user.profile.full_name}</h3>
            {user.profile.job_title && <p className="text-muted-foreground">{user.profile.job_title}</p>}
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="mr-1 h-4 w-4" />
              {user.email}
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.profile.bio && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">About</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{user.profile.bio}</p>
            </div>
          </>
        )}

        {/* Contact Information */}
        {(user.profile.phone_number || user.profile.location) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Contact Information</h4>
              <div className="space-y-2">
                {user.profile.phone_number && (
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    {user.profile.phone_number}
                  </div>
                )}
                {user.profile.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    {user.profile.location}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Social Links */}
        {(user.profile.linkedin || user.profile.github) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Social Links</h4>
              <div className="space-y-2">
                {user.profile.linkedin && (
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                    <a href={user.profile.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="mr-2 h-4 w-4" />
                      LinkedIn
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </a>
                  </Button>
                )}
                {user.profile.github && (
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                    <a href={user.profile.github} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
