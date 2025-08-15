"use client";

import { SignupForm } from "@/components/signup-form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // This effect is no longer strictly necessary if the hook handles redirection,
  // but it's good for catching edge cases and initial load.
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignupForm />
    </div>
  );
}
