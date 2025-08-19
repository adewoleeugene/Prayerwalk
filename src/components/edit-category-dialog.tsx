
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { usePrayerStore } from '@/hooks/use-prayer-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Category } from '@/lib/types';

const categorySchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
});

type EditCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
};

export function EditCategoryDialog({ open, onOpenChange, category }: EditCategoryDialogProps) {
  const { updateCategory } = usePrayerStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
    },
  });
  
  useEffect(() => {
    if (category) {
      form.reset({ name: category.name });
    }
  }, [category, form]);

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    if (!category) return;
    
    setIsSubmitting(true);
    try {
      await updateCategory(category.id, { name: values.name });
      onOpenChange(false);
      toast({
        title: "Category Updated",
        description: `The category has been renamed to "${values.name}".`,
      })
    } catch (error) {
      console.error("Failed to update category:", error);
      toast({
        variant: "destructive",
        title: "Failed to update category",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Rename your category. The icon will be updated automatically.
          </DialogDescription>
        </DialogHeader>
        {category && (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Community" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
                </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
