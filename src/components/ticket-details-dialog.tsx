
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { type Ticket } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { User, Calendar, Tag, ArrowUp, Milestone } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function TicketDetailsDialog({ ticket, isOpen, onOpenChange }: TicketDetailsDialogProps) {
  if (!ticket) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{ticket.title}</DialogTitle>
          <DialogDescription>{ticket.id}</DialogDescription>
        </DialogHeader>
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
                    <h4 className="font-semibold flex items-center gap-2"><User className="w-4 h-4"/> Assignee</h4>
                    <div className="flex items-center gap-2">
                         {ticket.assignee ? (
                            <>
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={ticket.assignee.avatarUrl} alt={ticket.assignee.name} data-ai-hint="person avatar"/>
                                    <AvatarFallback>{ticket.assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">{ticket.assignee.name}</span>
                            </>
                        ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2"><User className="w-4 h-4"/> Reporter</h4>
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
      </DialogContent>
    </Dialog>
  );
}
