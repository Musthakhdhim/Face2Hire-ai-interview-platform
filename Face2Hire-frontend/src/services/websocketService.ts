declare global {
  interface Window {
    global?: Window;
  }
}

if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type MessageHandler = (payload: unknown) => void;

class WebSocketService {
  private client: Client | null = null;
  private handlers: Map<string, MessageHandler> = new Map();

  connect(sessionId: number, token: string, onConnected: () => void) {
    // ✅ Append token as query parameter (SockJS preserves it)
    const wsUrl = `${import.meta.env.VITE_API_BASE_URL}/ws/interview?token=${token}`;
    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      // connectHeaders: { Authorization: `Bearer ${token}` }, // optional now
      debug: () => {},
      onConnect: () => {
        this.subscribeToUserQueue('/queue/interview.state', (msg: IMessage) => {
          const payload = JSON.parse(msg.body);
          this.handlers.get('state')?.(payload);
        });
        this.subscribeToUserQueue('/queue/interview.timer', (msg: IMessage) => {
          const payload = JSON.parse(msg.body);
          this.handlers.get('timer')?.(payload);
        });
        this.client?.publish({
          destination: '/app/interview.join',
          body: JSON.stringify(sessionId),
        });
        onConnected();
      },
      onStompError: (frame) => console.error('STOMP error', frame),
    });
    this.client.activate();
  }

  private subscribeToUserQueue(destination: string, callback: (msg: IMessage) => void) {
    if (!this.client) return;
    this.client.subscribe(`/user${destination}`, callback);
  }

  on(event: 'state' | 'timer', handler: MessageHandler) {
    this.handlers.set(event, handler);
  }

  sendAudioChunk(_chunk: Blob) {
    // For simplicity we skip live streaming; final audio is sent via REST.
  }

  disconnect() {
    this.client?.deactivate();
  }
}

export const websocketService = new WebSocketService();