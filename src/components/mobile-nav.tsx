
"use client";

import { Button } from "@/components/ui/button";
import { Activity, Home, Library, Settings, Sparkles, NotebookText } from "lucide-react";
import type { View } from "@/app/page";

type MobileNavProps = {
  activeView: View['type'];
  onNavigate: (view: View) => void;
  onCaptureClick: () => void;
};

export function MobileNav({ activeView, onNavigate, onCaptureClick }: MobileNavProps) {
  const navItems = [
    { view: { type: 'home' } as View, icon: Home, label: 'Home' },
    { view: { type: 'library' } as View, icon: Library, label: 'Library' },
    // Placeholder for the FAB
    { view: null, icon: null, label: 'Capture' },
    { view: { type: 'activity' } as View, icon: Activity, label: 'Activity' },
    { view: { type: 'settings' } as View, icon: Settings, label: 'Settings' },
  ];

  const getButtonClass = (viewType: View['type']) => {
    return `inline-flex flex-col items-center justify-center px-5 rounded-none h-full ${activeView === viewType ? 'text-primary' : 'text-muted-foreground'}`;
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full grid-cols-5 mx-auto font-medium">
        {navItems.map((item, index) => {
          if (index === 2) {
            return (
              <div key="fab-container" className="flex items-center justify-center">
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full shadow-lg -translate-y-4 bg-primary hover:bg-primary/90"
                  onClick={onCaptureClick}
                >
                  <Sparkles className="w-6 h-6" />
                  <span className="sr-only">Take Note</span>
                </Button>
              </div>
            );
          }
          
          if (!item.view || !item.icon) return null;

          const Icon = item.icon;
          return (
            <Button
              key={item.label}
              variant="ghost"
              className={getButtonClass(item.view.type)}
              onClick={() => onNavigate(item.view!)}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
