
"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { deleteTicketAction, updateTicketAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { type Ticket, type User, type TicketStatus, type Project } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { User as UserIcon, Calendar, Tag, ArrowUp, Milestone, Pencil, Trash2, FolderKanban, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";
import { allUsers, initialProjects } from "@/data/tickets"; 
import { initialStatuses } from "@/data/statuses";

const STATUSES_STORAGE_KEY = 'proflow-statuses';
const PROJECTS_STORAGE_KEY = 'proflow-projects';

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTicketUpdated: (ticket: Ticket) => void;
  onTicketDeleted: (ticketId: string) => void;
}

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  status: z.string().min(1, { message: "Status is required."}),
  priority: z.enum(['Low', 'Medium', 'High']),
  assigneeId: z.string().optional(),
  category: z.string().optional(),
  projectId: z.string().min(1, { message: "Project is required." }),
});

export function TicketDetailsDialog({ ticket, isOpen, onOpenChange, onTicketUpdated, onTicketDeleted }: TicketDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<TicketStatus[]>(initialStatuses);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  useEffect(() => {
    const storedStatuses = localStorage.getItem(STATUSES_STORAGE_KEY);
    if (storedStatuses) {
      setStatuses(JSON.parse(storedStatuses));
    }
     const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
    }
  }, [isOpen]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (ticket) {
      form.reset({
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        assigneeId: ticket.assignee?.id,
        category: ticket.category,
        projectId: ticket.projectId,
      });
    }
  }, [ticket, form, isEditing]); // Rerun when editing starts

  if (!ticket) {
    return null;
  }

  const assignee = allUsers.find(u => u.id === ticket.assignee?.id);
  const project = projects.find(p => p.id === ticket.projectId);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!ticket) return;

    startTransition(async () => {
       const result = await updateTicketAction({ id: ticket.id, ...values, reporter: ticket.reporter });
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: result.error,
        });
      } else if (result.ticket) {
        toast({
          title: "Success!",
          description: "Ticket has been updated.",
        });
        // We need to merge the existing ticket data with the updated data
        const fullyUpdatedTicket = { ...ticket, ...result.ticket };
        onTicketUpdated(fullyUpdatedTicket);
        setIsEditing(false);
      }
    });
  }

  function onDelete() {
    if (!ticket) return;
    
    startDeleteTransition(async () => {
      const result = await deleteTicketAction({ id: ticket.id });
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: result.error,
        });
      } else if (result.id) {
        toast({
          title: "Success!",
          description: "Ticket has been deleted.",
        });
        onTicketDeleted(result.id);
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) setIsEditing(false);
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between pr-12">
            {isEditing ? `Editing: ${ticket.title}` : ticket.title}
            
          </DialogTitle>
          {!isEditing && <DialogDescription>{ticket.id}</DialogDescription>}
        </DialogHeader>

        {!isEditing && (
            <div className="absolute top-6 right-16 flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                    <Pencil className="w-4 h-4" />
                    <span className="sr-only">Edit Ticket</span>
                </Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon">
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Delete Ticket</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this
                            ticket.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

        )}

        {isEditing ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-6 -mr-6">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                        <Input {...field} />
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
                        <Textarea className="resize-none min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="status"
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
                            {statuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
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
                                <SelectValue placeholder="Select a priority" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {(['Low', 'Medium', 'High'] as const).map(priority => (
                                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assignee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an assignee" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {allUsers.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. UI/UX" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        ) : (
            <div className="overflow-y-auto pr-6 -mr-6 grid md:grid-cols-3 gap-x-8 gap-y-4">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2 text-base">Description</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                </div>
                <div className="space-y-6">
                     <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-muted-foreground text-sm"><Milestone className="w-4 h-4"/> Status</h4>
                            <Badge variant="secondary">{ticket.status}</Badge>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-muted-foreground text-sm"><FolderKanban className="w-4 h-4"/> Project</h4>
                            <Badge variant="secondary">{project?.name}</Badge>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-muted-foreground text-sm"><ArrowUp className="w-4 h-4"/> Priority</h4>
                            <Badge
                            variant="outline"
                            className={cn(
                                "capitalize",
                                ticket.priority === "High" && "border-red-500/60 text-red-500 dark:border-red-400/50 dark:text-red-400",
                                ticket.priority === "Medium" && "border-yellow-500/60 text-yellow-500 dark:border-yellow-400/50 dark:text-yellow-400",
                                ticket.priority === "Low" && "border-green-500/60 text-green-500 dark:border-green-400/50 dark:text-green-400"
                            )}
                            >
                            {ticket.priority}
                            </Badge>
                        </div>
                        {ticket.category && (
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-muted-foreground text-sm"><Tag className="w-4 h-4"/> Category</h4>
                                <Badge variant="secondary">{ticket.category}</Badge>
                            </div>
                        )}
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-muted-foreground"/>
                                <span className="font-semibold text-muted-foreground text-sm">Assignee</span>
                            </div>
                            <div className="flex items-center gap-2 pl-2">
                                {assignee ? (
                                    <>
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={assignee.avatarUrl} alt={assignee.name} data-ai-hint="person avatar"/>
                                            <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{assignee.name}</span>
                                    </>
                                ) : (
                                    <span className="text-sm text-muted-foreground pl-7">Unassigned</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-muted-foreground"/>
                                <span className="font-semibold text-muted-foreground text-sm">Reporter</span>
                            </div>
                            <div className="flex items-center gap-2 pl-2">
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={ticket.reporter.avatarUrl} alt={ticket.reporter.name} data-ai-hint="person avatar" />
                                    <AvatarFallback>{ticket.reporter.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{ticket.reporter.name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Created</span>
                            <span title={format(new Date(ticket.createdAt), "PPPppp")}>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Updated</span>
                            <span title={format(new Date(ticket.updatedAt), "PPPppp")}>{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
