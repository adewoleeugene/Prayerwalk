"use client";

import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useOnboardingStore } from "@/hooks/use-onboarding-store";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isOnboardingCompleted } = useOnboardingStore();

  useEffect(() => {
    if (!loading && user) {
      if (isOnboardingCompleted) {
        router.push('/');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, loading, isOnboardingCompleted, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  );
}
