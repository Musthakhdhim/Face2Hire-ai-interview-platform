// Declare global to avoid 'any'
declare global {
  interface Window {
    global?: Window;
  }
}

// Polyfill for sockjs-client
if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type MessageHandler = (message: IMessage) => void;

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
        this.subscribeToUserQueue('/queue/interview.state', (msg: IMessage) => {
          this.handlers.get('state')?.(msg);
        });
        this.subscribeToUserQueue('/queue/interview.timer', (msg: IMessage) => {
          this.handlers.get('timer')?.(msg);
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

  private subscribeToUserQueue(destination: string, callback: (msg: IMessage) => void) {
    if (!this.client) return;
    this.client.subscribe(`/user${destination}`, callback);
  }

  on(event: 'state' | 'timer', handler: MessageHandler) {
    this.handlers.set(event, handler);
  }

  sendAudioChunk(_chunk: Blob) {
    // Convert to base64 and send (optional – we'll use REST for final answer)
    // For simplicity we skip live streaming; final audio is sent via REST after answer.
  }

  disconnect() {
    this.client?.deactivate();
  }
}

export const websocketService = new WebSocketService();