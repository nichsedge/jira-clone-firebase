
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveATicket = active.data.current?.type === "Ticket";
    const isOverATicket = over.data.current?.type === "Ticket";
    const isOverAColumn = over.data.current?.type === "Column";

    setTickets((prevTickets) => {
      let newTickets = [...prevTickets];
      const activeTicketIndex = newTickets.findIndex((t) => t.id === activeId);
      if (activeTicketIndex === -1) return prevTickets; // Should not happen

      const activeTicket = { ...newTickets[activeTicketIndex] };

      // Scenario 1: Reordering tickets within the same column
      if (isActiveATicket && isOverATicket) {
        const overTicketIndex = newTickets.findIndex((t) => t.id === overId);
        if (activeTicket.status === newTickets[overTicketIndex].status) {
          return arrayMove(newTickets, activeTicketIndex, overTicketIndex);
        }
      }

      // Scenario 2: Moving a ticket to a new column
      let newStatus: TicketStatus;
      if (isOverAColumn) {
        // Dropped on a column
        newStatus = overId as TicketStatus;
      } else if (isOverATicket) {
        // Dropped on a ticket in another column
        const overTicketIndex = newTickets.findIndex((t) => t.id === overId);
        newStatus = newTickets[overTicketIndex].status;
      } else {
        return prevTickets; // Should not happen
      }

      if (activeTicket.status === newStatus) return prevTickets; // No change if status is the same

      // Update the ticket's status
      activeTicket.status = newStatus;
      newTickets[activeTicketIndex] = activeTicket;

      // The drag-and-drop library will visually place the item,
      // but we need to re-sort our flat array based on the new status
      // to ensure the data model is consistent.
      // A simple way is to create new groups and flatten them.
      const updatedGrouped = newTickets.reduce((acc, ticket) => {
        if (!acc[ticket.status]) {
          acc[ticket.status] = [];
        }
        acc[ticket.status].push(ticket);
        return acc;
      }, {} as Record<TicketStatus, Ticket[]>);

      // Recreate the tickets array based on the column order
      const finalTickets = columns.flatMap(status => updatedGrouped[status] || []);

      return finalTickets;
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
