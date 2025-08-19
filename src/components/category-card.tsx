
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getIcon } from "./icons";
import { ChevronRight, MoreVertical, Edit, Trash2 } from "lucide-react";
import { usePrayerStore } from "@/hooks/use-prayer-store";
import { Category } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


type CategoryCardProps = {
  name: string;
  icon: string;
  count: number;
  onClick: () => void;
  onEdit: () => void;
  isManageable: boolean;
  category?: Category;
};

export function CategoryCard({ name, icon, count, onClick, onEdit, isManageable, category }: CategoryCardProps) {
  const Icon = getIcon(icon);
  const { deleteCategory } = usePrayerStore();
  const { toast } = useToast();

  const handleDelete = () => {
    if(category) {
      deleteCategory(category.id);
      toast({
        variant: "destructive",
        title: "Category Deleted",
        description: `The "${category.name}" category and its prayers have been deleted.`
      });
    }
  }

  return (
    <Card
      className="shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={onClick}>
          <div className="p-3 bg-secondary rounded-lg">
            <Icon className="h-6 w-6 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{count} prayer(s)</p>
          </div>
        </div>
        
        {isManageable ? (
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the <strong>{name}</strong> category and all prayers inside it. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        ) : (
            <ChevronRight className="h-6 w-6 text-muted-foreground" />
        )}
      </CardContent>
    </Card>
  );
}
