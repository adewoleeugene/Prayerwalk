"use client";

import { Button } from "@/components/ui/button";
import { Home, Library, Notebook, Settings, Sparkles } from "lucide-react";
import type { View } from "@/app/page";

type MobileNavProps = {
  activeView: View['type'];
  onNavigate: (view: View) => void;
  onCaptureClick: () => void;
};

export function MobileNav({ activeView, onNavigate, onCaptureClick }: MobileNavProps) {
  const navItems = [
    { view: { type: 'dashboard' }, icon: Home, label: 'Home' },
    { view: { type: 'prayerList', viewId: 'all' }, icon: Library, label: 'Prayers' },
    { view: { type: 'journal' }, icon: Notebook, label: 'Journal' },
    { view: { type: 'settings' }, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full grid-cols-5 mx-auto font-medium">
        
        {navItems.slice(0, 2).map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`inline-flex flex-col items-center justify-center px-5 rounded-none h-full ${activeView === item.view.type ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => onNavigate(item.view as any)}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}

        <div className="flex items-center justify-center">
          <Button
            size="lg"
            className="w-16 h-16 rounded-full shadow-lg -translate-y-4 bg-primary hover:bg-primary/90"
            onClick={onCaptureClick}
          >
            <Sparkles className="w-6 h-6" />
            <span className="sr-only">Take Note</span>
          </Button>
        </div>

        {navItems.slice(2, 4).map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={`inline-flex flex-col items-center justify-center px-5 rounded-none h-full ${activeView === item.view.type ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => onNavigate(item.view as any)}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
