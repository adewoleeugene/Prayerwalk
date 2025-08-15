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
    { view: { type: 'home' }, icon: Home, label: 'Home' },
    { view: { type: 'library' }, icon: Library, label: 'Library' },
    { view: { type: 'journal' }, icon: Notebook, label: 'Journal' },
    { view: { type: 'settings' }, icon: Settings, label: 'Settings' },
  ];

  const getButtonClass = (viewType: View['type']) => {
    return `inline-flex flex-col items-center justify-center px-5 rounded-none h-full ${activeView === viewType ? 'text-primary' : 'text-muted-foreground'}`;
  }

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full grid-cols-5 mx-auto font-medium">
        
        <Button
          key={navItems[0].label}
          variant="ghost"
          className={getButtonClass(navItems[0].view.type)}
          onClick={() => onNavigate(navItems[0].view)}
        >
          <navItems[0].icon className="w-6 h-6 mb-1" />
          <span className="text-xs">{navItems[0].label}</span>
        </Button>
        
        <Button
          key={navItems[1].label}
          variant="ghost"
          className={getButtonClass(navItems[1].view.type)}
          onClick={() => onNavigate(navItems[1].view)}
        >
          <navItems[1].icon className="w-6 h-6 mb-1" />
          <span className="text-xs">{navItems[1].label}</span>
        </Button>

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
        
        <Button
          key={navItems[2].label}
          variant="ghost"
          className={getButtonClass(navItems[2].view.type)}
          onClick={() => onNavigate(navItems[2].view)}
        >
          <navItems[2].icon className="w-6 h-6 mb-1" />
          <span className="text-xs">{navItems[2].label}</span>
        </Button>
        
        <Button
          key={navItems[3].label}
          variant="ghost"
          className={getButtonClass(navItems[3].view.type)}
          onClick={() => onNavigate(navItems[3].view)}
        >
          <navItems[3].icon className="w-6 h-6 mb-1" />
          <span className="text-xs">{navItems[3].label}</span>
        </Button>
      </div>
    </div>
  );
}
