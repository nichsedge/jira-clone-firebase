
"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
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

const screenReaderInstructions: Announcements = {
  onDragStart({ active }) {
    return `Picked up draggable item ${active.id}.`;
  },
  onDragOver({ active, over }) {
    if (over && over.id) {
      return `Draggable item ${active.id} was moved over droppable area ${over.id}.`;
    }
    return `Draggable item ${active.id} is no longer over a droppable area.`;
  },
  onDragEnd({ active, over }) {
    if (over && over.id) {
      return `Draggable item ${active.id} was dropped over droppable area ${over.id}`;
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
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTicket = getTicketById(activeId);
    if (!activeTicket) return;

    const overContainer = over.data.current?.sortable?.containerId || over.id as TicketStatus;
    const activeContainer = active.data.current?.sortable.containerId as TicketStatus;

    if (activeContainer === overContainer) {
      // Reordering within the same column
      setTickets((prevTickets) => {
        const columnTickets = prevTickets.filter(t => t.status === activeContainer);
        const oldIndex = columnTickets.findIndex((t) => t.id === activeId);
        const newIndex = columnTickets.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prevTickets;

        const reorderedColumn = arrayMove(columnTickets, oldIndex, newIndex);
        
        const otherTickets = prevTickets.filter(t => t.status !== activeContainer);
        return [...otherTickets, ...reorderedColumn].sort((a,b) => (new Date(b.createdAt)).getTime() - (new Date(a.createdAt).getTime()));
      });
    } else {
      // Moving to a different column
      const overIsColumn = columns.includes(overId as TicketStatus);
      const newStatus = overIsColumn ? overId as TicketStatus : over.data.current?.sortable?.containerId as TicketStatus;

      if (!newStatus) return;

      setTickets((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return prev;

        const updatedTicket = { ...prev[activeIndex], status: newStatus };
        const newTickets = [...prev];
        newTickets[activeIndex] = updatedTicket;

        return newTickets;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      screenReaderInstructions={screenReaderInstructions}
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
