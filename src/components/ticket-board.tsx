
"use client";

import { useMemo, useState, useEffect } from "react";
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
  onTicketUpdated: (ticket: Ticket) => void;
}

export function TicketBoard({ tickets, setTickets, onTicketUpdated }: TicketBoardProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])


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
  
    setTickets((prevTickets) => {
      const activeTicket = prevTickets.find((t) => t.id === activeId);
      if (!activeTicket) return prevTickets;
  
      let newStatus: TicketStatus | undefined;
      const overIsColumn = columns.find(c => c === overId);
      if (overIsColumn) {
        newStatus = overIsColumn;
      } else {
        const overTicket = prevTickets.find(t => t.id === overId);
        if(overTicket) {
          newStatus = overTicket.status;
        }
      }
  
      if (!newStatus) return prevTickets;
  
      const activeIndex = prevTickets.findIndex((t) => t.id === activeId);
      let overIndex: number;
  
      let newTickets = [...prevTickets];
      const [movedTicket] = newTickets.splice(activeIndex, 1);
      movedTicket.status = newStatus;
  
      if (overIsColumn) {
        const columnTickets = newTickets.filter(t => t.status === newStatus);
        if (columnTickets.length > 0) {
           const lastTicketInColumn = columnTickets[columnTickets.length-1];
           overIndex = newTickets.findIndex(t => t.id === lastTicketInColumn.id) + 1;
        } else {
            // Find the index of the first ticket of the next column
            const columnIndex = columns.indexOf(newStatus);
            let nextColumnTicketIndex = -1;
            for(let i = columnIndex + 1; i < columns.length; i++) {
                const foundTicket = newTickets.find(t => t.status === columns[i]);
                if (foundTicket) {
                    nextColumnTicketIndex = newTickets.indexOf(foundTicket);
                    break;
                }
            }
            if (nextColumnTicketIndex !== -1) {
                overIndex = nextColumnTicketIndex;
            } else {
                overIndex = newTickets.length;
            }
        }
      } else {
         overIndex = newTickets.findIndex((t) => t.id === overId);
      }
      
      newTickets.splice(overIndex, 0, movedTicket);
      return newTickets;
    });
  };

  if (!isClient) {
    return null;
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTicket(null)}
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
        {activeTicket ? <TicketCard ticket={activeTicket} isOverlay /> : null}
      </DragOverlay>
      <TicketDetailsDialog 
        isOpen={!!selectedTicket} 
        onOpenChange={(isOpen) => !isOpen && setSelectedTicket(null)}
        ticket={selectedTicket}
        onTicketUpdated={(updatedTicket) => {
          onTicketUpdated(updatedTicket);
          // Also update the selected ticket to reflect changes immediately
          setSelectedTicket(current => current ? {...current, ...updatedTicket} : null);
        }}
      />
    </DndContext>
  );
}
