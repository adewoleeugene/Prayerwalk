"use client";

import { useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { JournalPage } from "@/app/journal/page";
import { SettingsPage } from "@/app/settings/page";
import { MobileNav } from "@/components/mobile-nav";
import { IntelligentCaptureDialog } from "@/components/intelligent-capture-dialog";
import { HomePage } from "@/components/home-page";
import ProfilePage from "./profile/page";

export type View = 
  | { type: 'home' } 
  | { type: 'library' }
  | { type: 'journal' }
  | { type: 'settings' }
  | { type: 'profile' };

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<View>({ type: 'home' });
  const [isCaptureDialogOpen, setIsCaptureDialogOpen] = useState(false);

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
  
  const renderView = () => {
    switch(view.type) {
      case 'home':
        return <HomePage onCaptureClick={() => setIsCaptureDialogOpen(true)} setView={setView} />;
      case 'library':
        return <Dashboard onCaptureClick={() => setIsCaptureDialogOpen(true)} />;
      case 'journal':
        return <JournalPage />;
      case 'settings':
        return <SettingsPage setView={setView} />;
      case 'profile':
        return <ProfilePage setView={setView} />;
      default:
        return <HomePage onCaptureClick={() => setIsCaptureDialogOpen(true)} setView={setView} />;
    }
  }

  return (
    <main className="pb-20 md:pb-0">
      {renderView()}
      <MobileNav
        activeView={view.type}
        onNavigate={setView}
        onCaptureClick={() => setIsCaptureDialogOpen(true)}
      />
      <IntelligentCaptureDialog open={isCaptureDialogOpen} onOpenChange={setIsCaptureDialogOpen} />
    </main>
  );
}
