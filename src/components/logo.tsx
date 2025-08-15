import { HandHelping } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2 text-xl font-bold text-primary">
      <HandHelping className="h-7 w-7" />
      <span className="font-headline">PraySmart</span>
    </div>
  );
};
