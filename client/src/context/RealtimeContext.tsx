import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface RealtimeEventPayload {
  eventName: string;
  data: any;
  timestamp: number;
}

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeEventPayload | null;
  subscribe: (eventName: string, handler: (data: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const subscribe = useCallback((eventName: string, handler: (data: any) => void) => {
    if (!listenersRef.current.has(eventName)) {
      listenersRef.current.set(eventName, new Set());
    }
    listenersRef.current.get(eventName)!.add(handler);

    return () => {
      const set = listenersRef.current.get(eventName);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          listenersRef.current.delete(eventName);
        }
      }
    };
  }, []);

  const triggerEvent = useCallback((eventName: string, data: any) => {
    const payload: RealtimeEventPayload = {
      eventName,
      data,
      timestamp: Date.now(),
    };
    setLastEvent(payload);

    // 1. Invoke direct context subscribers
    const handlers = listenersRef.current.get(eventName);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error(`Error in realtime handler for ${eventName}:`, e);
        }
      });
    }

    // Wildcard subscribers
    const wildcardHandlers = listenersRef.current.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((fn) => {
        try {
          fn({ eventName, data });
        } catch (e) {
          console.error(`Error in realtime wildcard handler:`, e);
        }
      });
    }

    // 2. Dispatch custom window event
    try {
      window.dispatchEvent(
        new CustomEvent(`tuition:event:${eventName}`, { detail: data })
      );
      window.dispatchEvent(
        new CustomEvent('tuition:event:all', { detail: { eventName, data } })
      );
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isSubscribed = true;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      if (!isSubscribed) return;

      const baseUrl = (import.meta as any).env?.VITE_API_URL || '/api';
      const sseUrl = `${baseUrl}/events/stream?token=${encodeURIComponent(token)}`;

      try {
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (isSubscribed) {
            setIsConnected(true);
          }
        };

        const eventTypes = [
          'connected',
          'notification:new',
          'notification:read',
          'payment:created',
          'fee:assigned',
          'attendance:saved',
          'doubt:updated',
          'leave:updated',
          'assignment:updated',
          'student:updated',
          'settings:updated',
        ];

        eventTypes.forEach((evt) => {
          es.addEventListener(evt, (e: MessageEvent) => {
            if (!isSubscribed) return;
            try {
              const data = e.data ? JSON.parse(e.data) : {};
              triggerEvent(evt, data);
            } catch {
              triggerEvent(evt, {});
            }
          });
        });

        es.onerror = () => {
          if (isSubscribed) {
            setIsConnected(false);
            es.close();
            // Reconnect in 5 seconds
            reconnectTimeout = setTimeout(connectSSE, 5000);
          }
        };
      } catch (err) {
        console.warn('Failed to establish EventSource connection:', err);
        reconnectTimeout = setTimeout(connectSSE, 10000);
      }
    };

    connectSSE();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [token, isAuthenticated, triggerEvent]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

/**
 * Convenient hook to listen to specific real-time event(s) and trigger a callback
 * @param eventNames Event name or array of event names, e.g. 'payment:created' or ['doubt:updated', 'leave:updated']
 * @param callback Function to invoke when event occurs
 */
export const useRealtimeEvent = (
  eventNames: string | string[],
  callback: (data?: any) => void
) => {
  const { subscribe } = useRealtime();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const events = Array.isArray(eventNames) ? eventNames : [eventNames];
    const unsubscribes = events.map((name) =>
      subscribe(name, (data) => {
        callbackRef.current(data);
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [Array.isArray(eventNames) ? eventNames.join(',') : eventNames, subscribe]);
};
