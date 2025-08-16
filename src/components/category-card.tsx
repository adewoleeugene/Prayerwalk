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
  
  const iconContainerClasses = {
    primary: "bg-primary-foreground/20",
    secondary: "bg-primary/10"
  }
  
  const iconClasses = {
    primary: "text-primary-foreground",
    secondary: "text-primary"
  }

  return (
    <Card
      className={cardClasses[variant]}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-start justify-between h-full">
        <div className="flex justify-between w-full items-start">
            <div className={`p-2 rounded-lg ${iconContainerClasses[variant]}`}>
                <Icon className={`h-6 w-6 ${iconClasses[variant]}`} />
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
