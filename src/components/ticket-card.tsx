
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { GripVertical } from "lucide-react";

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  isOverlay?: boolean;
}

export function TicketCard({ ticket, onClick, isOverlay }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, data: { type: "Ticket", ticket } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent dialog from opening when clicking the drag handle
    if ((e.target as HTMLElement).closest('button')?.dataset?.dndKitCore === 'true') {
      return;
    }
    onClick?.(ticket);
  };
  
  const Component = (
     <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onClick ? handleCardClick : undefined}
      className={cn(onClick ? "cursor-pointer" : "", isOverlay && "shadow-2xl")}
    >
      <Card
        className={cn(
          "hover:bg-muted/50 transition-colors relative",
          isDragging && "opacity-30"
        )}
      >
        <button
          {...listeners}
          data-dnd-kit-core="true"
          className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-grab"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <CardHeader className="p-4 pl-8 pb-2">
          <CardTitle className="text-base font-medium">{ticket.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pl-8 pt-2">
          <div className="flex space-x-2 text-sm text-muted-foreground mb-4">
            <div className="font-medium">{ticket.id}</div>
            <div>•</div>
            <div>
              {formatDistanceToNow(new Date(ticket.createdAt), {
                addSuffix: true,
              })}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
               {ticket.assignee ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={ticket.assignee.avatarUrl}
                    data-ai-hint="person avatar"
                    alt={ticket.assignee.name}
                  />
                  <AvatarFallback>{ticket.assignee.name[0]}</AvatarFallback>
                </Avatar>
              ) : (
                 <Avatar className="h-6 w-6">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
              {ticket.category && (
                <Badge variant="secondary">{ticket.category}</Badge>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                ticket.priority === "High" &&
                  "border-red-500/60 text-red-500 dark:border-red-400/50 dark:text-red-400",
                ticket.priority === "Medium" &&
                  "border-yellow-500/60 text-yellow-500 dark:border-yellow-400/50 dark:text-yellow-400",
                ticket.priority === "Low" && 
                  "border-green-500/60 text-green-500 dark:border-green-400/50 dark:text-green-400"
              )}
            >
              {ticket.priority}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="rounded-lg border bg-card text-card-foreground shadow-sm opacity-50 h-[130px]" />;
  }


  return Component;
}
