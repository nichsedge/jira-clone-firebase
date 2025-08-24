"use client";

import { useEffect, useState, useCallback } from 'react';
import { createRealtimeClient, type RealtimeEvent } from '@/lib/realtime';
import { type Ticket, type User } from '@/lib/types';

interface UseRealtimeOptions {
  onTicketCreated?: (ticket: Ticket) => void;
  onTicketUpdated?: (ticket: Ticket) => void;
  onTicketDeleted?: (ticketId: string) => void;
  onUserJoined?: (user: User) => void;
  onUserLeft?: (userId: string) => void;
  enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    onTicketCreated,
    onTicketUpdated,
    onTicketDeleted,
    onUserJoined,
    onUserLeft,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const client = createRealtimeClient();

    const unsubscribe = client.subscribe((event: RealtimeEvent) => {
      setIsConnected(true);
      setConnectionError(null);

      switch (event.type) {
        case 'ticket_created':
          onTicketCreated?.(event.data);
          break;
        case 'ticket_updated':
          onTicketUpdated?.(event.data);
          break;
        case 'ticket_deleted':
          onTicketDeleted?.(event.data.id);
          break;
        case 'user_joined':
          onUserJoined?.(event.data);
          break;
        case 'user_left':
          onUserLeft?.(event.data.userId);
          break;
      }
    });

    // Handle connection errors
    const handleConnectionError = () => {
      setIsConnected(false);
      setConnectionError('Failed to connect to real-time updates');
    };

    // Set up error handling (this would be improved with better error handling)
    const errorHandler = setTimeout(() => {
      if (!isConnected) {
        setConnectionError('Connection timeout');
      }
    }, 10000);

    return () => {
      clearTimeout(errorHandler);
      unsubscribe();
      setIsConnected(false);
    };
  }, [
    enabled,
    onTicketCreated,
    onTicketUpdated,
    onTicketDeleted,
    onUserJoined,
    onUserLeft,
  ]);

  return {
    isConnected,
    connectionError,
  };
}

// Hook for ticket-specific real-time updates
export function useTicketRealtime(ticketId?: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTicketUpdate = useCallback((updatedTicket: Ticket) => {
    if (!ticketId || updatedTicket.id === ticketId) {
      setTicket(updatedTicket);
    }
  }, [ticketId]);

  const handleTicketDelete = useCallback((deletedTicketId: string) => {
    if (ticketId === deletedTicketId) {
      setTicket(null);
    }
  }, [ticketId]);

  const { isConnected, connectionError } = useRealtime({
    onTicketUpdated: handleTicketUpdate,
    onTicketDeleted: handleTicketDelete,
    enabled: !!ticketId,
  });

  return {
    ticket,
    isLoading,
    isConnected,
    connectionError,
    setTicket,
  };
}

// Hook for all tickets real-time updates
export function useTicketsRealtime() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTicketCreated = useCallback((newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
  }, []);

  const handleTicketUpdated = useCallback((updatedTicket: Ticket) => {
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    );
  }, []);

  const handleTicketDeleted = useCallback((deletedTicketId: string) => {
    setTickets(prev => prev.filter(ticket => ticket.id !== deletedTicketId));
  }, []);

  const { isConnected, connectionError } = useRealtime({
    onTicketCreated: handleTicketCreated,
    onTicketUpdated: handleTicketUpdated,
    onTicketDeleted: handleTicketDeleted,
  });

  return {
    tickets,
    setTickets,
    isLoading,
    isConnected,
    connectionError,
  };
}

// Hook for user presence tracking
export function useUserPresence() {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const handleUserJoined = useCallback((user: User) => {
    setOnlineUsers(prev => [...prev, user]);
  }, []);

  const handleUserLeft = useCallback((userId: string) => {
    setOnlineUsers(prev => prev.filter(user => user.id !== userId));
  }, []);

  const { isConnected, connectionError } = useRealtime({
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
  });

  return {
    onlineUsers,
    isConnected,
    connectionError,
  };
}