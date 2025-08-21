
"use client"

import { useState, useEffect, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Project } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
})

interface AddProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectToEdit?: Project;
  onProjectAdded: (project: Omit<Project, 'id'>) => void;
  onProjectUpdated: (project: Project) => void;
}

export function AddProjectDialog({ isOpen, onOpenChange, projectToEdit, onProjectAdded, onProjectUpdated }: AddProjectDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (projectToEdit) {
      form.reset(projectToEdit);
    } else {
      form.reset({ name: "", description: "" });
    }
  }, [projectToEdit, form, isOpen]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(() => {
      if (projectToEdit) {
        onProjectUpdated({ ...projectToEdit, ...values });
      } else {
        onProjectAdded(values);
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{projectToEdit ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          <DialogDescription>
            {projectToEdit ? 'Update the details for this project.' : 'Fill in the details to add a new project.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Q4 Marketing Campaign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of the project." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (projectToEdit ? "Saving..." : "Adding...") : (projectToEdit ? "Save Changes" : "Add Project")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
