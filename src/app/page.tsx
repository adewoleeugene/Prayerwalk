"use client";

import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PrayerList } from "@/components/prayer-list";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<{ type: 'dashboard' } | { type: 'prayerList', viewId: string }>({ type: 'dashboard' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <main>
      {view.type === 'dashboard' ? (
        <Dashboard onSelectView={(viewId) => setView({ type: 'prayerList', viewId })} />
      ) : (
        <PrayerList view={view.viewId} onBack={() => setView({ type: 'dashboard' })} />
      )}
    </main>
  );
}
