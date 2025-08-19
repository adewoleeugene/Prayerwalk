
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getIcon } from "./icons";
import { ChevronRight } from "lucide-react";
import { Badge } from "./ui/badge";

type CategoryCardProps = {
  name: string;
  icon: string;
  count: number;
  onClick: () => void;
};

export function CategoryCard({ name, icon, count, onClick }: CategoryCardProps) {
  const Icon = getIcon(icon);

  return (
    <Card
      className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-secondary rounded-lg">
            <Icon className="h-6 w-6 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{count} prayer(s)</p>
          </div>
        </div>
        <ChevronRight className="h-6 w-6 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
