
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

const columns: TicketStatus[] = ["To Do", "In Progress", "Done"];

interface TicketBoardProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
}

export function TicketBoard({ tickets, setTickets }: TicketBoardProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

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
      let newTickets = [...prevTickets];
      const activeTicketIndex = newTickets.findIndex((t) => t.id === activeId);
      const overTicketIndex = newTickets.findIndex((t) => t.id === overId);

      const isActiveATicket = active.data.current?.type === "Ticket";
      const isOverAColumn = over.data.current?.type === "Column";
      
      if (isActiveATicket) {
        let newStatus: TicketStatus | undefined;
        let newIndex: number | undefined;

        if (isOverAColumn) {
          // Moving to a new column
          newStatus = over.id as TicketStatus;
          const columnTickets = ticketsByStatus[newStatus];
          newIndex = columnTickets.length; // Add to the end of the new column
        } else {
          // Dropping on another ticket
          const overTicket = newTickets[overTicketIndex];
          if (overTicket) {
            newStatus = overTicket.status;
            newIndex = overTicketIndex;
          }
        }
        
        if (newStatus !== undefined && activeTicketIndex !== -1) {
            const activeTicket = { ...newTickets[activeTicketIndex], status: newStatus };
            
            // Remove from old position
            newTickets.splice(activeTicketIndex, 1);
            
            // Find new insertion index
            const finalTickets = [...newTickets];
            let insertionIndex = finalTickets.findIndex(t => t.id === overId);
            if (isOverAColumn) {
                // Find the index of the first ticket in the target column, or the end of the array
                const firstTicketInColumnIndex = finalTickets.findIndex(t => t.status === newStatus);
                if (firstTicketInColumnIndex !== -1) {
                    insertionIndex = ticketsByStatus[newStatus].length + finalTickets.filter(t => t.status === newStatus).length
                } else {
                   // if column is empty, find where to insert based on column order
                    const columnIndex = columns.indexOf(newStatus);
                    let insertBeforeStatusIndex = -1;
                    for (let i = columnIndex + 1; i < columns.length; i++) {
                        const status = columns[i];
                        const foundIndex = finalTickets.findIndex(t => t.status === status);
                        if(foundIndex !== -1) {
                            insertBeforeStatusIndex = foundIndex;
                            break;
                        }
                    }
                    if(insertBeforeStatusIndex !== -1) {
                        insertionIndex = insertBeforeStatusIndex;
                    } else {
                        insertionIndex = finalTickets.length;
                    }
                }
            } else {
                insertionIndex = newTickets.findIndex(t => t.id === overId);
                 if (insertionIndex === -1) insertionIndex = newTickets.length;
            }


            const ticketsInOverColumn = newTickets.filter(t => t.status === newStatus);
            if (isOverAColumn) {
                newTickets.push(activeTicket);
            } else if (overTicketIndex !== -1) {
                const overIsLastInColumn = ticketsInOverColumn.length > 0 && ticketsInOverColumn[ticketsInOverColumn.length - 1].id === overId;
                const insertionPoint = newTickets.findIndex(t => t.id === overId);
                if(overIsLastInColumn) {
                     newTickets.splice(insertionPoint + 1, 0, activeTicket);
                } else {
                    newTickets.splice(insertionPoint, 0, activeTicket);
                }
            }
            
            const reordered = columns.flatMap(status => newTickets.filter(t => t.status === status));
            return reordered;
        }
      }
      return prevTickets;
    });
  };

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
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? <TicketCard ticket={activeTicket} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
