
"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { type Ticket, type TicketStatus } from "@/lib/types";
import { TicketColumn } from "./ticket-column";

const columns: TicketStatus[] = ["To Do", "In Progress", "Done"];

interface TicketBoardProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
}

export function TicketBoard({ tickets, setTickets }: TicketBoardProps) {
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

  const getTicketById = (id: UniqueIdentifier) => tickets.find(t => t.id === id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      return;
    }
    
    setTickets((currentTickets) => {
      const activeTicket = currentTickets.find((t) => t.id === activeId);
      const overTicket = currentTickets.find((t) => t.id === overId);

      if (!activeTicket) {
        return currentTickets;
      }
      
      const activeContainer = active.data.current?.sortable.containerId as TicketStatus;
      const overContainer = over.data.current?.sortable?.containerId || (over.id as TicketStatus);

      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        // Handle reordering within the same column
        const columnTickets = ticketsByStatus[activeContainer];
        const oldIndex = columnTickets.findIndex((t) => t.id === activeId);
        const newIndex = columnTickets.findIndex((t) => t.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedColumn = arrayMove(columnTickets, oldIndex, newIndex);
          const otherTickets = currentTickets.filter(t => t.status !== activeContainer);
          return [...otherTickets, ...reorderedColumn];
        }
        return currentTickets;
      }
      
      // Handle moving to a different column
      let newTickets = [...currentTickets];
      const activeIndex = newTickets.findIndex((t) => t.id === activeId);

      // Update status
      newTickets[activeIndex] = {
        ...newTickets[activeIndex],
        status: overContainer,
        createdAt: new Date(), // Simulate update time
      };

      // If dropped on another ticket, insert it there.
      if (overTicket) {
        const overIndex = newTickets.findIndex((t) => t.id === overId);
        const [movedTicket] = newTickets.splice(activeIndex, 1);
        const adjustedOverIndex = overIndex > activeIndex ? overIndex -1 : overIndex;
        newTickets.splice(adjustedOverIndex + 1, 0, movedTicket);
      }

      return newTickets;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
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
    </DndContext>
  );
}

  