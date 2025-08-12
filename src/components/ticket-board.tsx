"use client";

import { type Ticket } from "@/lib/types";
import { TicketCard } from "./ticket-card";

const columns: Ticket['status'][] = ['To Do', 'In Progress', 'Done'];

interface TicketBoardProps {
  tickets: Ticket[];
}

export function TicketBoard({ tickets }: TicketBoardProps) {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {columns.map(status => (
        <div key={status} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="font-bold text-lg">{status}</h2>
            <span className="text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 text-sm font-medium">
              {tickets.filter(t => t.status === status).length}
            </span>
          </div>
          <div className="flex flex-col gap-4 rounded-lg bg-muted/60 p-4 min-h-[200px] border">
            {tickets
              .filter(ticket => ticket.status === status)
              .map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
