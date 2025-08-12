
"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  type Announcer,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { type Ticket, type TicketStatus } from "@/lib/types";
import { TicketColumn } from "./ticket-column";

const columns: TicketStatus[] = ["To Do", "In Progress", "Done"];

interface TicketBoardProps {
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
}

const customAnnouncements: Announcer = {
  onDragStart({ active }) {
    return `Picked up draggable item ${active.id}.`;
  },
  onDragOver({ active, over }) {
    if (over) {
      return `Draggable item ${active.id} was moved over droppable area ${over.id}.`;
    }
    return `Draggable item ${active.id} is no longer over a droppable area.`;
  },
  onDragEnd({ active, over }) {
    if (over) {
      return `Draggable item ${active.id} was dropped over droppable area ${over.id}.`;
    }
    return `Draggable item ${active.id} was dropped.`;
  },
  onDragCancel({ active }) {
    return `Dragging was cancelled. Draggable item ${active.id} was dropped.`;
  },
};

export function TicketBoard({ tickets, setTickets }: TicketBoardProps) {
  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, Ticket[]> = {
      "To Do": [],
      "In Progress": [],
      Done: [],
    };
    for (const ticket of tickets) {
      if(ticket.status) {
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
    
    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable?.containerId || over.id;

    if (!activeContainer || !overContainer) {
      return;
    }

    if (activeContainer === overContainer) {
      // Reordering within the same column
      setTickets((prevTickets) => {
        const columnTickets = prevTickets.filter(t => t.status === activeContainer);
        const oldIndex = columnTickets.findIndex((t) => t.id === activeId);
        const newIndex = columnTickets.findIndex((t) => t.id === overId);
        const reorderedColumn = arrayMove(columnTickets, oldIndex, newIndex);
        
        const otherTickets = prevTickets.filter(t => t.status !== activeContainer);
        return [...otherTickets, ...reorderedColumn];
      });
    } else {
      // Moving to a different column
      setTickets((prev) => {
        return prev.map((ticket) => {
          if (ticket.id === activeId) {
            return { ...ticket, status: overContainer as TicketStatus };
          }
          return ticket;
        });
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      announcements={customAnnouncements}
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
