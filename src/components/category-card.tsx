"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getIcon } from "./icons";

type CategoryCardProps = {
  name: string;
  icon: string;
  count: number;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

export function CategoryCard({ name, icon, count, onClick, variant = 'secondary' }: CategoryCardProps) {
  const Icon = getIcon(icon);

  const cardClasses = {
    primary: "shadow-lg bg-primary text-primary-foreground",
    secondary: "shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
  };

  if (variant === 'primary') {
    return (
        <Card
            className={cardClasses.primary}
            onClick={onClick}
        >
            <CardContent className="p-4 flex flex-col items-start justify-between h-full">
                <div className="flex justify-between w-full items-start">
                    <div className="p-2 bg-primary-foreground/20 rounded-lg">
                        <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg font-semibold">{name}</h3>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card
      className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer bg-secondary"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center h-28 gap-2">
        <Icon className="h-8 w-8 text-secondary-foreground" />
        <h3 className="text-md font-semibold text-center text-secondary-foreground">{name}</h3>
        {count > 0 && <span className="absolute top-2 right-2 text-xs font-bold bg-primary text-primary-foreground h-5 w-5 flex items-center justify-center rounded-full">{count}</span>}
      </CardContent>
    </Card>
  );
}
