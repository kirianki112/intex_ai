import { OnboardingForm } from "@/components/auth/onboarding-form"

export default function OnboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-lg">
        <OnboardingForm />
      </div>
    </div>
  )
}
