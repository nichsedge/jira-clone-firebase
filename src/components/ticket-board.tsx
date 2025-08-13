
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
import { initialStatuses } from "@/data/statuses";

const STATUSES_STORAGE_KEY = 'proflow-statuses';

interface TicketBoardProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  onTicketUpdated: (ticket: Ticket) => void;
  onTicketDeleted: (ticketId: string) => void;
}

export function TicketBoard({ tickets, setTickets, onTicketUpdated, onTicketDeleted }: TicketBoardProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isClient, setIsClient] = useState(false)
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);

  useEffect(() => {
    setIsClient(true)
    const storedStatuses = localStorage.getItem(STATUSES_STORAGE_KEY);
    if (storedStatuses) {
      setStatuses(JSON.parse(storedStatuses));
    } else {
      setStatuses(initialStatuses);
    }
  }, [])


  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, Ticket[]> = {};
    statuses.forEach(status => {
        grouped[status] = [];
    });
    for (const ticket of tickets) {
      if (ticket.status && grouped[ticket.status]) {
        grouped[ticket.status].push(ticket);
      }
    }
    return grouped;
  }, [tickets, statuses]);

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
  
    if (activeId === overId) return;
  
    setTickets((prevTickets) => {
      const activeTicketIndex = prevTickets.findIndex((t) => t.id === activeId);
      const overTicketIndex = prevTickets.findIndex((t) => t.id === overId);
  
      let newTickets = [...prevTickets];
      const activeTicket = newTickets[activeTicketIndex];
  
      // Dropping on a column
      if (statuses.includes(overId as TicketStatus)) {
        const newStatus = overId as TicketStatus;
        if (activeTicket.status !== newStatus) {
          activeTicket.status = newStatus;
          // Move to the end of the new column's list of tickets
          const otherTickets = newTickets.filter(t => t.id !== activeId);
          const columnTickets = otherTickets.filter(t => t.status === newStatus);
          const lastTicketInColumn = columnTickets[columnTickets.length - 1];
          
          let newIndex;
          if (lastTicketInColumn) {
             const lastTicketIndex = newTickets.findIndex(t => t.id === lastTicketInColumn.id);
             newIndex = lastTicketIndex + 1;
          } else {
            // Find first ticket of next column
            const columnIndex = statuses.indexOf(newStatus);
            let nextColumnTicketIndex = -1;
            for(let i = columnIndex + 1; i < statuses.length; i++) {
                const foundTicket = newTickets.find(t => t.status === statuses[i]);
                if (foundTicket) {
                    nextColumnTicketIndex = newTickets.indexOf(foundTicket);
                    break;
                }
            }
             if (nextColumnTicketIndex !== -1) {
                newIndex = nextColumnTicketIndex;
            } else {
                newIndex = newTickets.length;
            }
          }
          
          newTickets = arrayMove(newTickets, activeTicketIndex, newIndex > activeTicketIndex ? newIndex - 1 : newIndex);
        }
      }
      // Dropping on another ticket
      else if (overTicketIndex !== -1) {
        const overTicket = newTickets[overTicketIndex];
        if (activeTicket.status !== overTicket.status) {
          activeTicket.status = overTicket.status;
          newTickets = arrayMove(newTickets, activeTicketIndex, overTicketIndex);
        } else {
          newTickets = arrayMove(newTickets, activeTicketIndex, overTicketIndex);
        }
      }
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
        {statuses.map((status) => (
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
        onTicketDeleted={onTicketDeleted}
      />
    </DndContext>
  );
}
