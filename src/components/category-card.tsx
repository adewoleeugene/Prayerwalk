"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getIcon } from "./icons";

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
      <CardContent className="p-4 flex flex-col items-start justify-between h-full">
        <div className="flex justify-between w-full items-start">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">{count}</span>
        </div>
        <div className="mt-4">
            <h3 className="text-lg font-semibold">{name}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
