"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { useOnboardingStore } from "@/hooks/use-onboarding-store";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isOnboardingCompleted } = useOnboardingStore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && isOnboardingCompleted) {
      router.push('/');
    }
  }, [user, loading, isOnboardingCompleted, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isOnboardingCompleted) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleOnboardingComplete = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    </div>
  );
}