"use client";

import { Button } from "@/components/ui/button";
import { Home, Plus, Sparkles, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

type MobileNavProps = {
  onCaptureClick: () => void;
  onAddPrayerClick: () => void;
};

export function MobileNav({ onCaptureClick, onAddPrayerClick }: MobileNavProps) {
  const { user } = useAuth();
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        
        <Button
          variant="ghost"
          className="inline-flex flex-col items-center justify-center px-5 rounded-none h-full text-muted-foreground"
          onClick={onAddPrayerClick}
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-xs">Add Prayer</span>
        </Button>

        <div className="flex items-center justify-center">
            <Button
              size="lg"
              className="w-16 h-16 rounded-full shadow-lg -translate-y-4"
              onClick={onCaptureClick}
            >
                <Sparkles className="w-6 h-6" />
                <span className="sr-only">Capture</span>
            </Button>
        </div>
       
        <div className="flex items-center justify-center">
             <div className="text-xs text-muted-foreground p-2 truncate">
                {user?.email}
            </div>
        </div>

      </div>
    </div>
  );
}
