
"use client"

import { useState, useTransition, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"
import { createTicketAction } from "@/app/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { type Ticket, type User, type TicketPriority } from "@/lib/types"
import { PlusCircle } from "lucide-react"
import { initialProjects } from "@/data/tickets"

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  priority: z.enum(['Low', 'Medium', 'High']),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, { message: "Project is required." }),
  reporterId: z.string().min(1, { message: "Reporter is required." }),
})

type CreateTicketDialogProps = {
  allUsers: User[];
  onTicketCreated: (newTicket: Ticket) => void;
  currentUser: User;
};

export function CreateTicketDialog({ allUsers, onTicketCreated, currentUser }: CreateTicketDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: 'Medium',
      projectId: initialProjects[0]?.id,
      reporterId: currentUser.id,
    },
  })
  
  useEffect(() => {
    // When the current user changes, update the reporterId field in the form.
    // This hook safely handles the side effect of updating form state.
    if (currentUser && form.getValues('reporterId') !== currentUser.id) {
        form.setValue('reporterId', currentUser.id, { shouldDirty: true });
    }
  }, [currentUser, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const reporter = allUsers.find(u => u.id === values.reporterId);
      if (!reporter) {
        toast({
          variant: "destructive",
          title: "Invalid Reporter",
          description: "The selected reporter could not be found.",
        });
        return;
      }
      
      const result = await createTicketAction({ ...values, reporter });

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: result.error,
        })
      } else if (result.ticket) {
        toast({
          title: "Success!",
          description: "Your ticket has been created.",
        })
        onTicketCreated(result.ticket)
        setOpen(false)
        form.reset({
            title: "",
            description: "",
            priority: 'Medium',
            projectId: initialProjects[0]?.id,
            reporterId: currentUser.id,
        })
      }
    })
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new ticket</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new support ticket.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Login button not working" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      {initialProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
                          {(['Low', 'Medium', 'High'] as TicketPriority[]).map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
            </div>
            <FormField
              control={form.control}
              name="reporterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reporter</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reporter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
