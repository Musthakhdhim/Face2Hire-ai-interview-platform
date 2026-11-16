import { useEffect, useRef } from 'react';
import { websocketService, type RealtimeEventDto } from '../services/websocketService';

export function useRealtimeSubscription(
  topics: (string | null | undefined)[],
  onEvent: (event: RealtimeEventDto) => void
) {
  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  const validTopicsKey = topics.filter(Boolean).join('|');

  useEffect(() => {
    const validTopics = validTopicsKey ? validTopicsKey.split('|') : [];
    if (validTopics.length === 0) return;

    const unsubscribers = validTopics.map((topic) =>
      websocketService.subscribe(topic, (event) => {
        callbackRef.current(event);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [validTopicsKey]);
}
