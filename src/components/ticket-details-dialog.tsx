
"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateTicketAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
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
import { type Ticket, type User, type TicketStatus } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { User as UserIcon, Calendar, Tag, ArrowUp, Milestone, Pencil } from 'lucide-react';
import { cn } from "@/lib/utils";
import { initialTickets } from "@/data/tickets"; // To get users for assignee dropdown

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTicketUpdated: (ticket: Ticket) => void;
}

const allUsers = initialTickets.flatMap(t => t.assignee ? [t.assignee] : []).reduce((acc, user) => {
  if (!acc.find(u => u.id === user.id)) {
    acc.push(user);
  }
  return acc;
}, [] as User[]);


const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  status: z.enum(['To Do', 'In Progress', 'Done']),
  priority: z.enum(['Low', 'Medium', 'High']),
  assigneeId: z.string().optional(),
  category: z.string().optional(),
});


export function TicketDetailsDialog({ ticket, isOpen, onOpenChange, onTicketUpdated }: TicketDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
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
      });
    }
  }, [ticket, form]);

  if (!ticket) {
    return null;
  }

  const assignee = allUsers.find(u => u.id === ticket.assignee?.id);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!ticket) return;

    startTransition(async () => {
      const result = await updateTicketAction({ id: ticket.id, ...values });
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
        onTicketUpdated(result.ticket);
        setIsEditing(false);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) setIsEditing(false);
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            {isEditing ? `Editing: ${ticket.title}` : ticket.title}
            {!isEditing && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                    <Pencil className="w-5 h-5" />
                    <span className="sr-only">Edit Ticket</span>
                </Button>
            )}
          </DialogTitle>
          {!isEditing && <DialogDescription>{ticket.id}</DialogDescription>}
        </DialogHeader>
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
                            {(['To Do', 'In Progress', 'Done'] as TicketStatus[]).map(status => (
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
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        ) : (
            <div className="overflow-y-auto pr-6 -mr-6 grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2 text-lg">Description</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Milestone className="w-4 h-4"/> Status</h4>
                        <Badge variant="secondary">{ticket.status}</Badge>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><ArrowUp className="w-4 h-4"/> Priority</h4>
                        <Badge
                        variant="outline"
                        className={cn(
                            "capitalize",
                            ticket.priority === "High" && "border-destructive/80 text-destructive",
                            ticket.priority === "Medium" && "border-yellow-500/80 text-yellow-500",
                            ticket.priority === "Low" && "border-green-500/80 text-green-500"
                        )}
                        >
                        {ticket.priority}
                        </Badge>
                    </div>
                    {ticket.category && (
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><Tag className="w-4 h-4"/> Category</h4>
                            <Badge variant="secondary">{ticket.category}</Badge>
                        </div>
                    )}
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><UserIcon className="w-4 h-4"/> Assignee</h4>
                        <div className="flex items-center gap-2">
                            {assignee ? (
                                <>
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src={assignee.avatarUrl} alt={assignee.name} data-ai-hint="person avatar"/>
                                        <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-muted-foreground">{assignee.name}</span>
                                </>
                            ) : (
                                <span className="text-sm text-muted-foreground">Unassigned</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><UserIcon className="w-4 h-4"/> Reporter</h4>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={ticket.reporter.avatarUrl} alt={ticket.reporter.name} data-ai-hint="person avatar" />
                                <AvatarFallback>{ticket.reporter.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{ticket.reporter.name}</span>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Created</span>
                            <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Created at</span>
                            <span>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
