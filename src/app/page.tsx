
"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useOnboardingStore } from "@/hooks/use-onboarding-store";
import { MobileNav } from "@/components/mobile-nav";
import { IntelligentCaptureDialog } from "@/components/intelligent-capture-dialog";
import dynamic from "next/dynamic";

// Lazy load components for better performance
const Dashboard = dynamic(() => import("@/components/dashboard").then(mod => ({ default: mod.Dashboard })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
});
const HomePage = dynamic(() => import("@/components/home-page").then(mod => ({ default: mod.HomePage })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
});
const SettingsPage = dynamic(() => import("@/app/settings/page").then(mod => ({ default: mod.SettingsPage })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
});
const ProfilePage = dynamic(() => import("./profile/page"), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
});
const PrayerWalkLobby = dynamic(() => import("./prayer-walk/page"), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
});
const ActivityPage = dynamic(() => import("./activity/page").then(mod => ({ default: mod.ActivityPage })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
});
const JournalPage = dynamic(() => import("./journal/page").then(mod => ({ default: mod.JournalPage })), {
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

export type View = 
  | { type: 'home' } 
  | { type: 'library' }
  | { type: 'activity' }
  | { type: 'journal' }
  | { type: 'settings' }
  | { type: 'profile' }
  | { type: 'prayer-walk' };

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isOnboardingCompleted } = useOnboardingStore();
  const [view, setView] = useState<View>({ type: 'home' });
  const [isCaptureDialogOpen, setIsCaptureDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && !isOnboardingCompleted) {
      router.push('/onboarding');
    }
  }, [user, loading, isOnboardingCompleted, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const renderView = () => {
    switch(view.type) {
      case 'home':
        return <HomePage onCaptureClick={() => setIsCaptureDialogOpen(true)} setView={setView} />;
      case 'library':
        return <Dashboard onCaptureClick={() => setIsCaptureDialogOpen(true)} />;
      case 'activity':
        return <ActivityPage setView={setView} />;
      case 'journal':
        return <JournalPage setView={setView} />;
      case 'settings':
        return <SettingsPage setView={setView} />;
      case 'profile':
        return <ProfilePage setView={setView} />;
      case 'prayer-walk':
        return <PrayerWalkLobby />;
      default:
        return <HomePage onCaptureClick={() => setIsCaptureDialogOpen(true)} setView={setView} />;
    }
  }

  return (
    <main className="pb-20 md:pb-0">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }>
        {renderView()}
      </Suspense>
      <MobileNav
        activeView={view.type}
        onNavigate={setView}
        onCaptureClick={() => setIsCaptureDialogOpen(true)}
      />
      <IntelligentCaptureDialog open={isCaptureDialogOpen} onOpenChange={setIsCaptureDialogOpen} />
    </main>
  );
}
