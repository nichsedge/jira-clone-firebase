
"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  type UniqueIdentifier,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { type Ticket, type TicketStatus } from "@/lib/types";
import { TicketColumn } from "./ticket-column";
import { TicketCard } from "./ticket-card";
import { TicketDetailsDialog } from "./ticket-details-dialog";

const columns: TicketStatus[] = ["To Do", "In Progress", "Done"];

interface TicketBoardProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
}

export function TicketBoard({ tickets, setTickets }: TicketBoardProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, Ticket[]> = {
      "To Do": [],
      "In Progress": [],
      Done: [],
    };
    for (const ticket of tickets) {
      if (ticket.status && grouped[ticket.status]) {
        grouped[ticket.status].push(ticket);
      }
    }
    return grouped;
  }, [tickets]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = tickets.find((t) => t.id === active.id);
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTicket = tickets.find((t) => t.id === activeId);
    if (!activeTicket) return;

    const overColumn = columns.find(c => c === over.id);
    const overTicket = tickets.find((t) => t.id === overId);
    
    // Determine the new status
    let newStatus: TicketStatus;
    if (overColumn) {
      newStatus = overColumn;
    } else if (overTicket) {
      newStatus = overTicket.status;
    } else {
      return; // Not a valid drop target
    }

    if (activeTicket.status === newStatus) {
      // Reordering within the same column
      setTickets((prevTickets) => {
        const activeIndex = prevTickets.findIndex((t) => t.id === activeId);
        const overIndex = prevTickets.findIndex((t) => t.id === overId);
        if (activeIndex !== -1 && overIndex !== -1) {
          return arrayMove(prevTickets, activeIndex, overIndex);
        }
        return prevTickets;
      });
    } else {
      // Moving to a new column
      setTickets((prevTickets) => {
        const activeIndex = prevTickets.findIndex((t) => t.id === activeId);

        // Update status
        const updatedTicket = { ...prevTickets[activeIndex], status: newStatus };
        
        // Remove from old position and insert into new
        const newTickets = [...prevTickets];
        newTickets.splice(activeIndex, 1);

        const overIndex = newTickets.findIndex((t) => t.id === overId);

        if (overTicket) { // Dropped on a ticket
          newTickets.splice(overIndex, 0, updatedTicket);
        } else { // Dropped on a column
           const ticketsInNewCol = newTickets.filter(t => t.status === newStatus);
           if (ticketsInNewCol.length > 0) {
             const lastTicketIndex = newTickets.findIndex(t => t.id === ticketsInNewCol[ticketsInNewCol.length - 1].id);
             newTickets.splice(lastTicketIndex + 1, 0, updatedTicket);
           } else {
             // Find insertion point based on column order if the column is empty
             const columnIndex = columns.indexOf(newStatus);
             let insertBeforeStatusIndex = -1;
             for (let i = columnIndex + 1; i < columns.length; i++) {
                 const status = columns[i];
                 const foundIndex = newTickets.findIndex(t => t.status === status);
                 if(foundIndex !== -1) {
                     insertBeforeStatusIndex = foundIndex;
                     break;
                 }
             }
             if(insertBeforeStatusIndex !== -1) {
                 newTickets.splice(insertBeforeStatusIndex, 0, updatedTicket);
             } else {
                 newTickets.push(updatedTicket);
             }
           }
        }
        return newTickets;
      });
    }
  };

  const screenReaderInstructions = {
    draggable: `
      To pick up a ticket, press the space bar.
      While dragging, use the arrow keys to move the ticket.
      Press space again to drop the ticket in its new position, or press escape to cancel.
    `,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTicket(null)}
      screenReaderInstructions={screenReaderInstructions}
    >
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((status) => (
          <TicketColumn
            key={status}
            status={status}
            tickets={ticketsByStatus[status] || []}
            onTicketClick={handleTicketClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? <TicketCard ticket={activeTicket} /> : null}
      </DragOverlay>
      <TicketDetailsDialog 
        isOpen={!!selectedTicket} 
        onOpenChange={(isOpen) => !isOpen && setSelectedTicket(null)}
        ticket={selectedTicket}
      />
    </DndContext>
  );
}
