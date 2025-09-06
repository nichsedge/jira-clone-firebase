
"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { type Ticket, type Status } from "@/lib/types";
import { TicketCard } from "./ticket-card";

interface TicketColumnProps {
  status: Status;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

export function TicketColumn({ status, tickets, onTicketClick }: TicketColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status.id,
    data: {
      type: "Column",
      status: status.id,
    },
  });

  return (
    <div className="flex flex-col gap-4 w-[300px] flex-shrink-0">
      <div className="flex items-center gap-2 px-1">
        <h2 className="font-bold text-lg">{status.name}</h2>
        <span className="text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 text-sm font-medium">
          {tickets.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="flex flex-col gap-4 rounded-lg bg-muted/60 p-4 min-h-[200px] border"
      >
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={onTicketClick}/>
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
