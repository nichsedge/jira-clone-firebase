
"use client"

import { useState, useEffect, useTransition } from "react"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { User, Status } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  statusId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
})

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userToEdit?: User;
  onUserAdded: (user: Omit<User, 'id'>) => void;
  onUserUpdated: (user: User) => void;
}

export function AddUserDialog({ isOpen, onOpenChange, userToEdit, onUserAdded, onUserUpdated }: AddUserDialogProps) {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      statusId: "",
      priority: 'MEDIUM',
    },
  });

  useEffect(() => {
    if (userToEdit) {
      form.reset({
        name: userToEdit.name || "",
        email: userToEdit.email || "",
        statusId: userToEdit.status?.id || "",
        priority: userToEdit.priority || 'MEDIUM',
      });
    } else {
      form.reset({
        name: "",
        email: "",
        statusId: "",
        priority: 'MEDIUM'
      });
    }
  }, [userToEdit, form, isOpen]);

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!session?.user?.id || !isOpen) {
        setIsLoadingStatuses(false);
        return;
      }

      try {
        setIsLoadingStatuses(true);
        const response = await fetch('/api/statuses');
        if (response.ok) {
          const data = await response.json();
          setStatuses(data);
        }
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
      } finally {
        setIsLoadingStatuses(false);
      }
    };

    fetchStatuses();
  }, [session?.user?.id, isOpen]);

  const name = form.watch("name");
  const avatarUrl = name ? `https://placehold.co/32x32/E9D5FF/6D28D9/png?text=${name.charAt(0).toUpperCase()}` : null;
  const priority = form.watch("priority");
  const statusId = form.watch("statusId");

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(() => {
        const finalAvatarUrl = values.name ? `https://placehold.co/32x32/E9D5FF/6D28D9/png?text=${values.name.charAt(0).toUpperCase()}` : '';
        const userData = {
          ...values,
          avatarUrl: finalAvatarUrl,
          statusId: values.statusId || null,
        };
      if (userToEdit) {
        onUserUpdated({
          ...userToEdit,
          ...userData,
          status: values.statusId ? { id: values.statusId, name: '', color: '' } : null
        });
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
  
            <FormField
              control={form.control}
              name="statusId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
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
