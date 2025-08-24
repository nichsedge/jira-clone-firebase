// Real-time updates using Server-Sent Events
import { NextRequest } from 'next/server';

export interface RealtimeEvent {
  type: 'ticket_created' | 'ticket_updated' | 'ticket_deleted' | 'user_joined' | 'user_left';
  data: any;
  timestamp: Date;
  userId?: string;
}

// In-memory event store (replace with Redis in production)
class EventStore {
  private events: RealtimeEvent[] = [];
  private maxEvents = 100;
  private listeners = new Set<(event: RealtimeEvent) => void>();

  addEvent(event: RealtimeEvent) {
    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  getRecentEvents(since?: Date): RealtimeEvent[] {
    if (!since) {
      return this.events.slice(-20); // Return last 20 events
    }

    return this.events.filter(event => event.timestamp > since);
  }

  subscribe(listener: (event: RealtimeEvent) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Cleanup old events periodically
  cleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp > oneHourAgo);
  }
}

export const eventStore = new EventStore();

// Cleanup old events every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(() => {
    eventStore.cleanup();
  }, 5 * 60 * 1000);
}

// Event broadcasting functions
export const broadcastEvent = {
  ticketCreated: (ticket: any, userId?: string) => {
    eventStore.addEvent({
      type: 'ticket_created',
      data: ticket,
      timestamp: new Date(),
      userId,
    });
  },

  ticketUpdated: (ticket: any, userId?: string) => {
    eventStore.addEvent({
      type: 'ticket_updated',
      data: ticket,
      timestamp: new Date(),
      userId,
    });
  },

  ticketDeleted: (ticketId: string, userId?: string) => {
    eventStore.addEvent({
      type: 'ticket_deleted',
      data: { id: ticketId },
      timestamp: new Date(),
      userId,
    });
  },

  userJoined: (user: any) => {
    eventStore.addEvent({
      type: 'user_joined',
      data: user,
      timestamp: new Date(),
    });
  },

  userLeft: (userId: string) => {
    eventStore.addEvent({
      type: 'user_left',
      data: { userId },
      timestamp: new Date(),
    });
  },
};

// Server-Sent Events endpoint
export async function handleRealtimeConnection(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lastEventId = searchParams.get('lastEventId');

  // Parse last event timestamp if provided
  let since: Date | undefined;
  if (lastEventId) {
    const timestamp = parseInt(lastEventId);
    if (!isNaN(timestamp)) {
      since = new Date(timestamp);
    }
  }

  // Get recent events
  const recentEvents = eventStore.getRecentEvents(since);

  // Create Server-Sent Events response
  const stream = new ReadableStream({
    start(controller) {
      // Send recent events immediately
      for (const event of recentEvents) {
        controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
      }

      // Subscribe to future events
      const unsubscribe = eventStore.subscribe((event) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        } catch (error) {
          // Connection might be closed
          unsubscribe();
        }
      });

      // Store unsubscribe function for cleanup
      (controller as any).unsubscribe = unsubscribe;
    },
    cancel() {
      // Clean up subscription when connection closes
      if ((this as any).unsubscribe) {
        (this as any).unsubscribe();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Client-side real-time hook
export function createRealtimeClient() {
  let eventSource: EventSource | null = null;
  let listeners = new Set<(event: RealtimeEvent) => void>();

  const connect = () => {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource('/api/realtime');

    eventSource.onmessage = (event) => {
      try {
        const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
        listeners.forEach(listener => {
          try {
            listener(realtimeEvent);
          } catch (error) {
            console.error('Error in event listener:', error);
          }
        });
      } catch (error) {
        console.error('Error parsing realtime event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (eventSource?.readyState === EventSource.CLOSED) {
          connect();
        }
      }, 5000);
    };
  };

  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  const subscribe = (listener: (event: RealtimeEvent) => void) => {
    listeners.add(listener);

    // Start connection if this is the first listener
    if (listeners.size === 1 && typeof window !== 'undefined') {
      connect();
    }

    // Return unsubscribe function
    return () => {
      listeners.delete(listener);

      // Disconnect if no more listeners
      if (listeners.size === 0) {
        disconnect();
      }
    };
  };

  return {
    subscribe,
    disconnect,
  };
}