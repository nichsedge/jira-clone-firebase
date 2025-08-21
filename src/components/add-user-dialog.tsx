
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
import { User } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
})

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userToEdit?: User;
  onUserAdded: (user: Omit<User, 'id'>) => void;
  onUserUpdated: (user: User) => void;
}

export function AddUserDialog({ isOpen, onOpenChange, userToEdit, onUserAdded, onUserUpdated }: AddUserDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (userToEdit) {
      form.reset(userToEdit);
    } else {
      form.reset({ name: "", email: "" });
    }
  }, [userToEdit, form, isOpen]);

  const name = form.watch("name");
  const avatarUrl = name ? `https://placehold.co/32x32/E9D5FF/6D28D9/png?text=${name.charAt(0).toUpperCase()}` : null;

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(() => {
        const finalAvatarUrl = values.name ? `https://placehold.co/32x32/E9D5FF/6D28D9/png?text=${values.name.charAt(0).toUpperCase()}` : '';
        const userData = { ...values, avatarUrl: finalAvatarUrl };
      if (userToEdit) {
        onUserUpdated({ ...userToEdit, ...userData });
      } else {
        onUserAdded(userData);
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{userToEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {userToEdit ? 'Update the details for this user.' : 'Fill in the details to add a new user to the system.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={name} data-ai-hint="person letter" />}
                    <AvatarFallback>{name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g. jane.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (userToEdit ? "Saving..." : "Adding...") : (userToEdit ? "Save Changes" : "Add User")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
