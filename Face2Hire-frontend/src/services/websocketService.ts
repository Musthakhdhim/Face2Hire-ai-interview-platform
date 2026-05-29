if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

import { Client } from '@stomp/stompjs';
import type { Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type MessageHandler = (message: any) => void;

class WebSocketService {
  private client: Client | null = null;
  private sessionId: number | null = null;
  private handlers: Map<string, MessageHandler> = new Map();

  connect(sessionId: number, token: string, onConnected: () => void) {
    this.sessionId = sessionId;
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws/interview`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: () => {},
      onConnect: () => {
        this.subscribeToUserQueue('/queue/interview.state', (msg) => {
          this.handlers.get('state')?.(JSON.parse(msg.body));
        });
        this.subscribeToUserQueue('/queue/interview.timer', (msg) => {
          this.handlers.get('timer')?.(JSON.parse(msg.body));
        });
        // Send join message
        this.client?.publish({
          destination: '/app/interview.join',
          body: JSON.stringify({ sessionId }),
        });
        onConnected();
      },
      onStompError: (frame) => console.error('STOMP error', frame),
    });
    this.client.activate();
  }

  private subscribeToUserQueue(destination: string, callback: (msg: Message) => void) {
    if (!this.client) return;
    this.client.subscribe(`/user${destination}`, callback);
  }

  on(event: 'state' | 'timer', handler: MessageHandler) {
    this.handlers.set(event, handler);
  }

  sendAudioChunk(chunk: Blob) {
    // Convert to base64 and send (optional – we'll use REST for final answer)
    // For simplicity we skip live streaming; final audio is sent via REST after answer.
  }

  disconnect() {
    this.client?.deactivate();
  }
}

export const websocketService = new WebSocketService();